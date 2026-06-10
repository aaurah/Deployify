import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router = Router();

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatProject(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/projects", async (_req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  return res.json(projects.map(formatProject));
});

router.post("/projects", async (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const slug = slugify(body.name);
  const productionUrl = `https://${slug}.deployify.app`;
  const [project] = await db
    .insert(projectsTable)
    .values({ ...body, slug, productionUrl, status: "active" })
    .returning();
  return res.status(201).json(formatProject(project));
});

router.get("/projects/:id", async (req, res) => {
  const { id } = GetProjectParams.parse({ id: Number(req.params.id) });
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return res.status(404).json({ error: "Project not found" });
  return res.json(formatProject(project));
});

router.patch("/projects/:id", async (req, res) => {
  const { id } = UpdateProjectParams.parse({ id: Number(req.params.id) });
  const body = UpdateProjectBody.parse(req.body);
  const [project] = await db
    .update(projectsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(projectsTable.id, id))
    .returning();
  if (!project) return res.status(404).json({ error: "Project not found" });
  return res.json(formatProject(project));
});

router.delete("/projects/:id", async (req, res) => {
  const { id } = DeleteProjectParams.parse({ id: Number(req.params.id) });
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  return res.status(204).send();
});

export default router;
