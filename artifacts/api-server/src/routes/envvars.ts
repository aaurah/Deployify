import { Router } from "express";
import { db } from "@workspace/db";
import { envVarsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListEnvVarsParams,
  CreateEnvVarBody,
  CreateEnvVarParams,
  DeleteEnvVarParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

function formatEnvVar(e: typeof envVarsTable.$inferSelect) {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
  };
}

// List env vars
router.get("/projects/:projectId/env", async (req, res) => {
  const { projectId } = ListEnvVarsParams.parse({ projectId: Number(req.params.projectId) });
  const vars = await db.select().from(envVarsTable).where(eq(envVarsTable.projectId, projectId));
  res.json(vars.map(formatEnvVar));
});

// Create env var
router.post("/projects/:projectId/env", async (req, res) => {
  const { projectId } = CreateEnvVarParams.parse({ projectId: Number(req.params.projectId) });
  const body = CreateEnvVarBody.parse(req.body);
  const [envVar] = await db
    .insert(envVarsTable)
    .values({ projectId, ...body, environment: body.environment ?? "all" })
    .returning();
  res.status(201).json(formatEnvVar(envVar));
});

// Delete env var
router.delete("/projects/:projectId/env/:envId", async (req, res) => {
  const { projectId, envId } = DeleteEnvVarParams.parse({
    projectId: Number(req.params.projectId),
    envId: Number(req.params.envId),
  });
  await db.delete(envVarsTable).where(and(eq(envVarsTable.id, envId), eq(envVarsTable.projectId, projectId)));
  res.status(204).send();
});

export default router;
