import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, deploymentsTable, domainsTable } from "@workspace/db";
import { eq, count, avg, sql, inArray } from "drizzle-orm";
import { GetProjectAnalyticsParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const [projectCount] = await db.select({ count: count() }).from(projectsTable);
  const [deploymentCount] = await db.select({ count: count() }).from(deploymentsTable);
  const [domainCount] = await db.select({ count: count() }).from(domainsTable);
  const [activeDeployments] = await db
    .select({ count: count() })
    .from(deploymentsTable)
    .where(eq(deploymentsTable.status, "building"));

  const [readyDeployments] = await db
    .select({ count: count() })
    .from(deploymentsTable)
    .where(eq(deploymentsTable.status, "ready"));

  const totalDone = (deploymentCount.count || 0);
  const successRate = totalDone > 0 ? ((readyDeployments.count || 0) / totalDone) * 100 : 0;

  const [avgBuild] = await db
    .select({ avg: avg(deploymentsTable.buildDurationMs) })
    .from(deploymentsTable)
    .where(eq(deploymentsTable.status, "ready"));

  res.json({
    totalProjects: projectCount.count,
    totalDeployments: deploymentCount.count,
    totalDomains: domainCount.count,
    activeDeployments: activeDeployments.count,
    successRate: Math.round(successRate * 10) / 10,
    avgBuildDurationMs: Math.round(Number(avgBuild.avg) || 0),
  });
});

router.get("/dashboard/activity", async (_req, res) => {
  const recentDeployments = await db
    .select({
      id: deploymentsTable.id,
      status: deploymentsTable.status,
      branch: deploymentsTable.branch,
      commitMessage: deploymentsTable.commitMessage,
      createdAt: deploymentsTable.createdAt,
      projectId: deploymentsTable.projectId,
    })
    .from(deploymentsTable)
    .orderBy(sql`${deploymentsTable.createdAt} DESC`)
    .limit(20);

  const projectIds = [...new Set(recentDeployments.map((d) => d.projectId))];
  const projects = projectIds.length
    ? await db
        .select({ id: projectsTable.id, name: projectsTable.name })
        .from(projectsTable)
        .where(inArray(projectsTable.id, projectIds))
    : [];

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const activity = recentDeployments.map((d) => ({
    id: d.id,
    type: "deployment",
    projectName: projectMap[d.projectId] ?? "Unknown",
    description: d.commitMessage ?? `Branch: ${d.branch}`,
    status: d.status,
    timestamp: d.createdAt.toISOString(),
  }));

  res.json(activity);
});

router.get("/projects/:projectId/analytics", async (req, res) => {
  const { projectId } = GetProjectAnalyticsParams.parse({ projectId: Number(req.params.projectId) });

  const [total] = await db.select({ count: count() }).from(deploymentsTable).where(eq(deploymentsTable.projectId, projectId));
  const [successful] = await db.select({ count: count() }).from(deploymentsTable).where(sql`${deploymentsTable.projectId} = ${projectId} AND ${deploymentsTable.status} = 'ready'`);
  const [failed] = await db.select({ count: count() }).from(deploymentsTable).where(sql`${deploymentsTable.projectId} = ${projectId} AND ${deploymentsTable.status} = 'error'`);
  const [avgBuild] = await db.select({ avg: avg(deploymentsTable.buildDurationMs) }).from(deploymentsTable).where(sql`${deploymentsTable.projectId} = ${projectId} AND ${deploymentsTable.status} = 'ready'`);

  // Deployments per day for last 14 days
  const dailyRows = await db.execute(sql`
    SELECT DATE(created_at) as date, COUNT(*)::int as count
    FROM deployments
    WHERE project_id = ${projectId}
      AND created_at >= NOW() - INTERVAL '14 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `);

  res.json({
    projectId,
    totalDeployments: total.count,
    successfulDeployments: successful.count,
    failedDeployments: failed.count,
    avgBuildDurationMs: Math.round(Number(avgBuild.avg) || 0),
    deploymentsPerDay: (dailyRows.rows as { date: string; count: number }[]).map((r) => ({
      date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().split("T")[0],
      count: r.count,
    })),
  });
});

export default router;
