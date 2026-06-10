import { Router } from "express";
import { db } from "@workspace/db";
import { deploymentsTable, deploymentLogsTable, projectsTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";

const router = Router();

interface AIIssue {
  category: string;
  title: string;
  description: string;
  fix: string;
  severity: "error" | "warning" | "info";
}

interface BuildStage {
  name: string;
  status: string;
  durationMs: number;
}

const ERROR_PATTERNS: Array<{
  regex: RegExp;
  category: string;
  title: string;
  description: string;
  fix: string;
  severity: "error" | "warning" | "info";
}> = [
  {
    regex: /Cannot find module '([^']+)'/,
    category: "dependency",
    title: "Missing module",
    description: "A required module could not be found. This usually means a package is not installed or the import path is wrong.",
    fix: "Run `npm install` or `pnpm install` to install dependencies. Check that the module name is correct and exists in package.json.",
    severity: "error",
  },
  {
    regex: /Type '([^']+)' is not assignable to type/,
    category: "typescript",
    title: "TypeScript type mismatch",
    description: "A value is being assigned to a variable or prop with an incompatible type.",
    fix: "Review the type definition and ensure the value matches the expected type. Add a type assertion or update the interface if the types are intentionally different.",
    severity: "error",
  },
  {
    regex: /EADDRINUSE/,
    category: "port",
    title: "Port already in use",
    description: "The server tried to bind to a port that is already occupied by another process.",
    fix: "Change the PORT environment variable or kill the process currently using the port with `lsof -ti :PORT | xargs kill -9`.",
    severity: "error",
  },
  {
    regex: /JavaScript heap out of memory|ENOMEM|Killed/,
    category: "memory",
    title: "Out of memory",
    description: "The build process ran out of available memory. This commonly happens with large bundles or heavy TypeScript compilation.",
    fix: "Increase Node.js memory limit with `NODE_OPTIONS=--max-old-space-size=4096`. Consider enabling tree-shaking or splitting code into smaller chunks.",
    severity: "error",
  },
  {
    regex: /npm ERR!|yarn error|pnpm error/i,
    category: "package-manager",
    title: "Package manager error",
    description: "The package manager encountered an error while installing or resolving dependencies.",
    fix: "Clear the cache with `npm cache clean --force` and delete node_modules, then reinstall. Check for conflicting peer dependencies.",
    severity: "error",
  },
  {
    regex: /SyntaxError: (.*)/,
    category: "syntax",
    title: "JavaScript syntax error",
    description: "Invalid JavaScript or TypeScript syntax was found in the source code.",
    fix: "Check the file and line mentioned in the error. Common causes: missing closing bracket, invalid template literal, or using reserved keywords.",
    severity: "error",
  },
  {
    regex: /ENOENT: no such file or directory/,
    category: "file",
    title: "File not found",
    description: "The build process tried to read or write a file that does not exist.",
    fix: "Ensure the file path is correct and the file exists. Check for case sensitivity issues in import paths, especially on Linux.",
    severity: "error",
  },
  {
    regex: /Error: Cannot resolve '([^']+)'/,
    category: "resolve",
    title: "Module resolution failed",
    description: "The bundler was unable to resolve an import path.",
    fix: "Check that aliases are configured correctly in vite.config.ts/webpack.config.js. Verify the import path and make sure the file exists.",
    severity: "error",
  },
  {
    regex: /error TS\d+/i,
    category: "typescript",
    title: "TypeScript compilation error",
    description: "TypeScript found one or more type errors that prevented compilation.",
    fix: "Run `tsc --noEmit` locally to see all type errors. Fix each error or add `// @ts-ignore` if it's a false positive (use sparingly).",
    severity: "error",
  },
  {
    regex: /Circular dependency/i,
    category: "circular-dep",
    title: "Circular dependency detected",
    description: "Two or more modules import each other, creating a circular reference. This can cause runtime errors or undefined values at module load time.",
    fix: "Refactor shared code into a third module that both can import from. Use lazy imports or dependency injection to break the cycle.",
    severity: "warning",
  },
  {
    regex: /WARN.*peer dep|peer dependency/i,
    category: "peer-dep",
    title: "Peer dependency warning",
    description: "A package requires a peer dependency that may not be installed or has a version mismatch.",
    fix: "Install the missing peer dependency or use `--legacy-peer-deps` flag. Check compatibility between major versions.",
    severity: "warning",
  },
  {
    regex: /Build time exceeded|timeout/i,
    category: "timeout",
    title: "Build timeout",
    description: "The build process exceeded the maximum allowed time.",
    fix: "Optimize your build by enabling caching, reducing bundle size, or splitting into smaller build steps. Consider using incremental builds.",
    severity: "error",
  },
  {
    regex: /chunk size exceeded|large bundle|warning.*size/i,
    category: "bundle-size",
    title: "Bundle size warning",
    description: "One or more output chunks exceed the recommended size limit, which will impact page load performance.",
    fix: "Use dynamic imports (lazy loading) to split large routes. Analyze the bundle with `vite build --report` and remove unused dependencies.",
    severity: "warning",
  },
  {
    regex: /Deprecation Warning/i,
    category: "deprecation",
    title: "Deprecated API usage",
    description: "The code is using one or more deprecated APIs that may be removed in future versions.",
    fix: "Review the deprecation notices and migrate to the recommended replacement APIs. Check the package changelog for migration guides.",
    severity: "info",
  },
];

function analyzeLogMessages(messages: string[]): AIIssue[] {
  const issues: AIIssue[] = [];
  const seenCategories = new Set<string>();

  for (const message of messages) {
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.regex.test(message) && !seenCategories.has(pattern.category)) {
        seenCategories.add(pattern.category);
        issues.push({
          category: pattern.category,
          title: pattern.title,
          description: pattern.description,
          fix: pattern.fix,
          severity: pattern.severity,
        });
      }
    }
  }

  return issues;
}

function extractBuildStages(messages: string[], totalDurationMs: number | null): BuildStage[] {
  const stages: BuildStage[] = [
    { name: "Clone repository", status: "success", durationMs: 0 },
    { name: "Install dependencies", status: "success", durationMs: 0 },
    { name: "Compile", status: "success", durationMs: 0 },
    { name: "Bundle assets", status: "success", durationMs: 0 },
    { name: "Deploy to edge", status: "success", durationMs: 0 },
  ];

  const hasError = messages.some((m) =>
    ERROR_PATTERNS.some((p) => p.severity === "error" && p.regex.test(m))
  );

  const stageKeywords = [
    ["clone", "cloning", "git"],
    ["install", "npm", "pnpm", "yarn", "dependencies"],
    ["compil", "typescript", "tsc", "transpil"],
    ["bundl", "vite", "webpack", "rollup", "asset"],
    ["deploy", "upload", "edge", "health check"],
  ];

  const base = (totalDurationMs ?? 15000) / stages.length;

  for (let i = 0; i < stages.length; i++) {
    const stageMessages = messages.filter((m) =>
      stageKeywords[i].some((k) => m.toLowerCase().includes(k))
    );

    if (hasError && i === stages.length - 1 && stageMessages.length === 0) {
      stages[i].status = "failed";
      stages[i].durationMs = Math.round(base * 0.3);
    } else {
      stages[i].durationMs = Math.round(base + (Math.random() * base * 0.4 - base * 0.2));
    }
  }

  if (hasError) {
    const failIndex = stages.findIndex((s) => s.status !== "success");
    if (failIndex === -1) {
      stages[stages.length - 1].status = "failed";
    }
  }

  return stages;
}

function generateSummary(
  status: string,
  issues: AIIssue[],
  durationMs: number | null
): string {
  if (status === "ready") {
    const dur = durationMs ? ` in ${(durationMs / 1000).toFixed(1)}s` : "";
    const warnings = issues.filter((i) => i.severity === "warning").length;
    if (warnings > 0) {
      return `Deployment succeeded${dur} with ${warnings} warning${warnings > 1 ? "s" : ""}. Review the warnings below to improve performance and compatibility.`;
    }
    return `Deployment completed successfully${dur}. All build stages passed with no issues detected.`;
  }

  if (status === "failed" || status === "error") {
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length === 0) {
      return "The deployment failed. No specific error pattern was detected in the build logs — check the raw logs for details.";
    }
    if (errors.length === 1) {
      return `Deployment failed due to a ${errors[0].title.toLowerCase()}. ${errors[0].description}`;
    }
    return `Deployment failed with ${errors.length} errors. The primary issue is a ${errors[0].title.toLowerCase()}. Resolve each issue below and redeploy.`;
  }

  if (status === "cancelled") {
    return "This deployment was manually cancelled before it completed.";
  }

  return "Deployment is in progress. AI analysis will be available once the build completes.";
}

function computeHealthScore(status: string, issues: AIIssue[]): number {
  if (status === "building" || status === "queued") return 50;
  if (status === "cancelled") return 40;

  let score = status === "ready" ? 100 : 30;

  for (const issue of issues) {
    if (issue.severity === "error") score -= 25;
    else if (issue.severity === "warning") score -= 8;
    else if (issue.severity === "info") score -= 2;
  }

  return Math.max(0, Math.min(100, score));
}

router.get("/ai/analyze-deployment/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deployment] = await db.select().from(deploymentsTable).where(eq(deploymentsTable.id, id));
  if (!deployment) return res.status(404).json({ error: "Not found" });

  const logs = await db
    .select()
    .from(deploymentLogsTable)
    .where(eq(deploymentLogsTable.deploymentId, id))
    .orderBy(deploymentLogsTable.timestamp);

  const messages = logs.map((l) => l.message);
  const issues = analyzeLogMessages(messages);
  const buildStages = extractBuildStages(messages, deployment.buildDurationMs);
  const summary = generateSummary(deployment.status, issues, deployment.buildDurationMs);
  const healthScore = computeHealthScore(deployment.status, issues);

  return res.json({
    deploymentId: id,
    status: deployment.status,
    summary,
    issues,
    healthScore,
    buildStages,
  });
});

router.get("/ai/project-insights/:projectId", async (req, res) => {
  const projectId = Number(req.params.projectId);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) return res.status(404).json({ error: "Not found" });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allDeployments = await db
    .select()
    .from(deploymentsTable)
    .where(and(eq(deploymentsTable.projectId, projectId), gte(deploymentsTable.createdAt, thirtyDaysAgo)))
    .orderBy(desc(deploymentsTable.createdAt));

  const recentDeployments = allDeployments.filter((d) => d.createdAt >= sevenDaysAgo);
  const olderDeployments = allDeployments.filter((d) => d.createdAt < sevenDaysAgo);

  const total = allDeployments.length;
  const failed = allDeployments.filter((d) => d.status === "error").length;
  const successful = allDeployments.filter((d) => d.status === "ready").length;
  const failureRate = total > 0 ? failed / total : 0;

  const withDuration = allDeployments.filter((d) => d.buildDurationMs);
  const avgBuildMs =
    withDuration.length > 0
      ? withDuration.reduce((s, d) => s + (d.buildDurationMs ?? 0), 0) / withDuration.length
      : 0;

  const recentFailed = recentDeployments.filter(
    (d) => d.status === "error"
  ).length;
  const olderFailed = olderDeployments.filter(
    (d) => d.status === "error"
  ).length;
  const recentRate = recentDeployments.length > 0 ? recentFailed / recentDeployments.length : 0;
  const olderRate = olderDeployments.length > 0 ? olderFailed / olderDeployments.length : 0;

  let recentTrend: "improving" | "stable" | "degrading" = "stable";
  if (olderDeployments.length >= 2 && recentDeployments.length >= 1) {
    if (recentRate < olderRate - 0.1) recentTrend = "improving";
    else if (recentRate > olderRate + 0.1) recentTrend = "degrading";
  }

  let healthScore = 100;
  if (failureRate > 0.5) healthScore -= 50;
  else if (failureRate > 0.3) healthScore -= 30;
  else if (failureRate > 0.1) healthScore -= 15;
  else if (failureRate > 0) healthScore -= 5;

  if (avgBuildMs > 120000) healthScore -= 15;
  else if (avgBuildMs > 60000) healthScore -= 8;

  if (total === 0) healthScore = 60;
  if (recentTrend === "degrading") healthScore -= 10;
  if (recentTrend === "improving") healthScore += 5;

  healthScore = Math.max(0, Math.min(100, healthScore));

  let grade = "A";
  if (healthScore < 60) grade = "D";
  else if (healthScore < 70) grade = "C";
  else if (healthScore < 80) grade = "B";
  else if (healthScore < 95) grade = "A";
  else grade = "A+";

  const recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }> = [];

  if (failureRate > 0.3) {
    recommendations.push({
      type: "reliability",
      title: "High failure rate detected",
      description: `${Math.round(failureRate * 100)}% of deployments in the last 30 days failed. Review build logs on failed deployments to identify recurring issues.`,
      priority: "high",
    });
  }

  if (avgBuildMs > 90000) {
    recommendations.push({
      type: "performance",
      title: "Slow build times",
      description: `Average build time is ${(avgBuildMs / 1000 / 60).toFixed(1)} minutes. Consider enabling build caching, reducing bundle size, or splitting into smaller builds.`,
      priority: "medium",
    });
  }

  if (total === 0) {
    recommendations.push({
      type: "activity",
      title: "No recent deployments",
      description: "This project has no deployments in the last 30 days. Consider triggering a deployment to keep the project active.",
      priority: "low",
    });
  }

  if (recentTrend === "degrading") {
    recommendations.push({
      type: "trend",
      title: "Deployment reliability declining",
      description: "Your failure rate is trending upward this week compared to last week. Investigate recent changes and run tests before deploying.",
      priority: "high",
    });
  }

  if (successful > 5 && failureRate === 0) {
    recommendations.push({
      type: "health",
      title: "Excellent deployment health",
      description: "All recent deployments succeeded. Consider enabling preview deployments for pull requests to maintain this track record.",
      priority: "low",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "health",
      title: "Project is healthy",
      description: "No critical issues detected. Keep monitoring build times and consider setting up automated deployment triggers.",
      priority: "low",
    });
  }

  return res.json({
    projectId,
    healthScore,
    grade,
    recommendations,
    recentTrend,
    failureRate,
    avgBuildMs,
  });
});

export default router;
