import { Router } from "express";
import { db } from "@workspace/db";
import { deploymentsTable, deploymentLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateDeploymentBody,
  ListDeploymentsParams,
  GetDeploymentParams,
  CancelDeploymentParams,
  PromoteDeploymentParams,
  GetDeploymentLogsParams,
  CreateDeploymentParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

function formatDeployment(d: typeof deploymentsTable.$inferSelect) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function formatLog(l: typeof deploymentLogsTable.$inferSelect) {
  return {
    ...l,
    timestamp: l.timestamp.toISOString(),
  };
}

function randomSha() {
  return Math.random().toString(16).slice(2, 9);
}

const FAILURE_SCENARIOS = [
  [
    { level: "info" as const, message: "Cloning repository from GitHub..." },
    { level: "info" as const, message: "Installing dependencies with pnpm..." },
    { level: "error" as const, message: "npm ERR! Cannot find module 'react-dom/client'" },
    { level: "error" as const, message: "npm ERR! Require stack: /app/src/index.tsx" },
    { level: "error" as const, message: "Build failed: dependency resolution error after 2 retries" },
  ],
  [
    { level: "info" as const, message: "Cloning repository from GitHub..." },
    { level: "info" as const, message: "Installing dependencies with pnpm... done in 12.4s" },
    { level: "info" as const, message: "Running build command: tsc && vite build" },
    { level: "info" as const, message: "Compiling TypeScript..." },
    { level: "error" as const, message: "error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'." },
    { level: "error" as const, message: "error TS2304: Cannot find name 'process'. Did you mean 'Promise'?" },
    { level: "error" as const, message: "Found 2 errors. Build failed." },
  ],
];

const WARNING_SCENARIOS = [
  [
    { level: "warn" as const, message: "WARN: peer dependency @types/react@18 requires react@>=18 but found 17" },
    { level: "warn" as const, message: "WARN: Bundle size 512kb exceeds recommended limit of 250kb for initial load" },
  ],
  [
    { level: "warn" as const, message: "WARN: Circular dependency detected: src/utils/api.ts → src/hooks/useAuth.ts → src/utils/api.ts" },
    { level: "warn" as const, message: "WARN: Deprecation notice: 'defaultProps' is deprecated in function components" },
  ],
];

async function simulateDeployment(deploymentId: number) {
  const shouldFail = Math.random() < 0.15;
  const warningScenario = Math.random() < 0.4 ? WARNING_SCENARIOS[Math.floor(Math.random() * WARNING_SCENARIOS.length)] : [];

  const successLogLines = [
    { level: "info" as const, message: "▶ Cloning repository from GitHub..." },
    { level: "info" as const, message: "  → Checked out branch in 1.2s" },
    { level: "info" as const, message: "▶ Installing dependencies with pnpm..." },
    { level: "info" as const, message: "  → Resolved 847 packages in 3.4s" },
    { level: "info" as const, message: "  → Installed node_modules in 9.1s" },
    ...warningScenario,
    { level: "info" as const, message: "▶ Running build command: pnpm run build" },
    { level: "info" as const, message: "  → Compiling TypeScript (strict mode)..." },
    { level: "info" as const, message: "  → TypeScript: 0 errors, 0 warnings" },
    { level: "info" as const, message: "▶ Bundling assets with Vite..." },
    { level: "info" as const, message: "  → dist/index.html                    0.52 kB" },
    { level: "info" as const, message: "  → dist/assets/index-BK5d8.js       182.40 kB │ gzip: 58.21 kB" },
    { level: "info" as const, message: "  → dist/assets/index-DiwrgTda.css     6.91 kB │ gzip:  2.01 kB" },
    { level: "info" as const, message: "▶ Optimizing and compressing assets..." },
    { level: "info" as const, message: "▶ Uploading build artifacts to edge network..." },
    { level: "info" as const, message: "  → Propagated to 47 PoP locations" },
    { level: "info" as const, message: "▶ Running health checks..." },
    { level: "info" as const, message: "  → HTTP 200 OK — response time 42ms" },
    { level: "info" as const, message: "✓ Deployment complete!" },
  ];

  await db.update(deploymentsTable).set({ status: "building" }).where(eq(deploymentsTable.id, deploymentId));

  if (shouldFail) {
    const failScenario = FAILURE_SCENARIOS[Math.floor(Math.random() * FAILURE_SCENARIOS.length)];
    for (const log of failScenario) {
      await db.insert(deploymentLogsTable).values({ deploymentId, ...log });
    }
    const buildDurationMs = Math.floor(Math.random() * 15000) + 5000;
    await db
      .update(deploymentsTable)
      .set({ status: "error", buildDurationMs, errorMessage: failScenario[failScenario.length - 1].message, updatedAt: new Date() })
      .where(eq(deploymentsTable.id, deploymentId));
    return;
  }

  for (const log of successLogLines) {
    await db.insert(deploymentLogsTable).values({ deploymentId, ...log });
  }

  const buildDurationMs = Math.floor(Math.random() * 20000) + 8000;
  const sha = randomSha();
  const deployUrl = `https://deploy-${sha}.deployify.app`;

  await db
    .update(deploymentsTable)
    .set({ status: "ready", buildDurationMs, deployUrl, updatedAt: new Date() })
    .where(eq(deploymentsTable.id, deploymentId));
}

// List deployments for a project
router.get("/projects/:projectId/deployments", async (req, res) => {
  const { projectId } = ListDeploymentsParams.parse({ projectId: Number(req.params.projectId) });
  const deployments = await db
    .select()
    .from(deploymentsTable)
    .where(eq(deploymentsTable.projectId, projectId))
    .orderBy(desc(deploymentsTable.createdAt));
  res.json(deployments.map(formatDeployment));
});

// Create deployment
router.post("/projects/:projectId/deployments", async (req, res) => {
  const { projectId } = CreateDeploymentParams.parse({ projectId: Number(req.params.projectId) });
  const body = CreateDeploymentBody.parse(req.body);
  const [deployment] = await db
    .insert(deploymentsTable)
    .values({
      projectId,
      branch: body.branch,
      environment: body.environment ?? "production",
      commitSha: body.commitSha ?? randomSha(),
      commitMessage: body.commitMessage ?? "Manual deployment",
      status: "queued",
    })
    .returning();

  res.status(201).json(formatDeployment(deployment));
  simulateDeployment(deployment.id).catch(console.error);
});

// Get deployment
router.get("/deployments/:id", async (req, res) => {
  const { id } = GetDeploymentParams.parse({ id: Number(req.params.id) });
  const [deployment] = await db.select().from(deploymentsTable).where(eq(deploymentsTable.id, id));
  if (!deployment) return res.status(404).json({ error: "Not found" });
  return res.json(formatDeployment(deployment));
});

// Delete deployment
router.delete("/deployments/:id/delete", async (req, res) => {
  const id = Number(req.params.id);
  const [deployment] = await db.select().from(deploymentsTable).where(eq(deploymentsTable.id, id));
  if (!deployment) return res.status(404).json({ error: "Not found" });
  await db.delete(deploymentLogsTable).where(eq(deploymentLogsTable.deploymentId, id));
  await db.delete(deploymentsTable).where(eq(deploymentsTable.id, id));
  return res.status(204).send();
});

// Cancel deployment
router.post("/deployments/:id/cancel", async (req, res) => {
  const { id } = CancelDeploymentParams.parse({ id: Number(req.params.id) });
  const [deployment] = await db
    .update(deploymentsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(deploymentsTable.id, id))
    .returning();
  if (!deployment) return res.status(404).json({ error: "Not found" });
  return res.json(formatDeployment(deployment));
});

// Promote to production
router.post("/deployments/:id/promote", async (req, res) => {
  const { id } = PromoteDeploymentParams.parse({ id: Number(req.params.id) });
  const [deployment] = await db
    .update(deploymentsTable)
    .set({ environment: "production", updatedAt: new Date() })
    .where(eq(deploymentsTable.id, id))
    .returning();
  if (!deployment) return res.status(404).json({ error: "Not found" });
  return res.json(formatDeployment(deployment));
});

// Get deployment logs
router.get("/deployments/:id/logs", async (req, res) => {
  const { id } = GetDeploymentLogsParams.parse({ id: Number(req.params.id) });
  const logs = await db
    .select()
    .from(deploymentLogsTable)
    .where(eq(deploymentLogsTable.deploymentId, id))
    .orderBy(deploymentLogsTable.timestamp);
  return res.json(logs.map(formatLog));
});

export default router;
