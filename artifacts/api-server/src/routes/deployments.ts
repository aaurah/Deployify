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

async function simulateDeployment(deploymentId: number) {
  const logLines = [
    { level: "info" as const, message: "Cloning repository..." },
    { level: "info" as const, message: "Installing dependencies with pnpm..." },
    { level: "info" as const, message: "Running build command: pnpm run build" },
    { level: "info" as const, message: "Compiling TypeScript..." },
    { level: "info" as const, message: "Bundling assets with Vite..." },
    { level: "info" as const, message: "Optimizing images..." },
    { level: "info" as const, message: "Generating static files..." },
    { level: "info" as const, message: "Uploading to edge network..." },
    { level: "info" as const, message: "Assigning deployment URL..." },
    { level: "info" as const, message: "Running health checks..." },
    { level: "info" as const, message: "Deployment complete! 🎉" },
  ];

  await db.update(deploymentsTable).set({ status: "building" }).where(eq(deploymentsTable.id, deploymentId));

  const buildStart = Date.now();
  for (const log of logLines) {
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
  res.json(formatDeployment(deployment));
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
  res.json(formatDeployment(deployment));
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
  res.json(formatDeployment(deployment));
});

// Get deployment logs
router.get("/deployments/:id/logs", async (req, res) => {
  const { id } = GetDeploymentLogsParams.parse({ id: Number(req.params.id) });
  const logs = await db
    .select()
    .from(deploymentLogsTable)
    .where(eq(deploymentLogsTable.deploymentId, id))
    .orderBy(deploymentLogsTable.timestamp);
  res.json(logs.map(formatLog));
});

export default router;
