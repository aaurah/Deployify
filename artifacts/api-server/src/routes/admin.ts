import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  auditLogsTable,
  systemSettingsTable,
  projectsTable,
  deploymentsTable,
  domainsTable,
} from "@workspace/db";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import {
  CreateAdminUserBody,
  UpdateAdminUserBody,
  UpdateAdminUserParams,
  DeleteAdminUserParams,
  UpdateSystemSettingsBody,
} from "@workspace/api-zod";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

function formatAudit(a: typeof auditLogsTable.$inferSelect) {
  return { ...a, createdAt: a.createdAt.toISOString() };
}

function formatSetting(s: typeof systemSettingsTable.$inferSelect) {
  return { ...s, updatedAt: s.updatedAt.toISOString() };
}

// ── Admin Stats ──────────────────────────────────────────────────────────────
router.get("/admin/stats", async (_req, res) => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [activeUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.status, "active"));
  const [projectCount] = await db.select({ count: count() }).from(projectsTable);
  const [deploymentCount] = await db.select({ count: count() }).from(deploymentsTable);
  const [domainCount] = await db.select({ count: count() }).from(domainsTable);
  const [readyDeployments] = await db.select({ count: count() }).from(deploymentsTable).where(eq(deploymentsTable.status, "ready"));
  const [avgBuild] = await db.select({ avg: avg(deploymentsTable.buildDurationMs) }).from(deploymentsTable).where(eq(deploymentsTable.status, "ready"));
  const [todayDeployments] = await db
    .select({ count: count() })
    .from(deploymentsTable)
    .where(sql`${deploymentsTable.createdAt} >= CURRENT_DATE`);

  const totalDone = deploymentCount.count || 0;
  const successRate = totalDone > 0 ? ((readyDeployments.count || 0) / totalDone) * 100 : 0;
  const avgMs = Math.round(Number(avgBuild.avg) || 0);
  const buildMinutes = Math.round((avgMs * totalDone) / 60000);

  res.json({
    totalUsers: userCount.count,
    activeUsers: activeUsers.count,
    totalProjects: projectCount.count,
    totalDeployments: deploymentCount.count,
    totalDomains: domainCount.count,
    successRate: Math.round(successRate * 10) / 10,
    avgBuildDurationMs: avgMs,
    deploymentsToday: todayDeployments.count,
    buildMinutesUsed: buildMinutes,
    storageUsedGb: Math.round((projectCount.count * 0.34 + deploymentCount.count * 0.08) * 10) / 10,
  });
});

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/admin/users", async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(formatUser));
});

router.post("/admin/users", async (req, res) => {
  const body = CreateAdminUserBody.parse(req.body);
  const [user] = await db
    .insert(usersTable)
    .values({ name: body.name, email: body.email, role: body.role ?? "member" })
    .returning();

  await db.insert(auditLogsTable).values({
    action: "create",
    resource: "user",
    resourceId: String(user.id),
    details: `Created user ${user.email} with role ${user.role}`,
    userEmail: "admin@deployify.app",
  });

  res.status(201).json(formatUser(user));
});

router.patch("/admin/users/:id", async (req, res) => {
  const { id } = UpdateAdminUserParams.parse({ id: Number(req.params.id) });
  const body = AdminUserUpdateBody.parse(req.body);

  const [user] = await db
    .update(usersTable)
    .set(body)
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) return res.status(404).json({ error: "User not found" });

  await db.insert(auditLogsTable).values({
    action: "update",
    resource: "user",
    resourceId: String(user.id),
    details: `Updated user ${user.email}: ${JSON.stringify(body)}`,
    userEmail: "admin@deployify.app",
  });

  res.json(formatUser(user));
});

router.delete("/admin/users/:id", async (req, res) => {
  const { id } = DeleteAdminUserParams.parse({ id: Number(req.params.id) });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "User not found" });

  await db.delete(usersTable).where(eq(usersTable.id, id));
  await db.insert(auditLogsTable).values({
    action: "delete",
    resource: "user",
    resourceId: String(id),
    details: `Deleted user ${user.email}`,
    userEmail: "admin@deployify.app",
  });

  res.status(204).send();
});

// ── All Projects ─────────────────────────────────────────────────────────────
router.get("/admin/projects", async (_req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  const deployCounts = await db
    .select({ projectId: deploymentsTable.projectId, count: count() })
    .from(deploymentsTable)
    .groupBy(deploymentsTable.projectId);

  const countMap = Object.fromEntries(deployCounts.map((d) => [d.projectId, d.count]));

  res.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      framework: p.framework,
      status: p.status,
      productionUrl: p.productionUrl,
      deploymentCount: countMap[p.id] ?? 0,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

// ── All Deployments ───────────────────────────────────────────────────────────
router.get("/admin/deployments", async (_req, res) => {
  const deployments = await db
    .select({
      id: deploymentsTable.id,
      projectId: deploymentsTable.projectId,
      status: deploymentsTable.status,
      environment: deploymentsTable.environment,
      branch: deploymentsTable.branch,
      commitSha: deploymentsTable.commitSha,
      commitMessage: deploymentsTable.commitMessage,
      buildDurationMs: deploymentsTable.buildDurationMs,
      createdAt: deploymentsTable.createdAt,
    })
    .from(deploymentsTable)
    .orderBy(desc(deploymentsTable.createdAt))
    .limit(100);

  const projectIds = [...new Set(deployments.map((d) => d.projectId))];
  const projects = projectIds.length
    ? await db.select({ id: projectsTable.id, name: projectsTable.name }).from(projectsTable).where(sql`${projectsTable.id} = ANY(${sql.raw(`ARRAY[${projectIds.join(",")}]`)})`)
    : [];

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  res.json(
    deployments.map((d) => ({
      ...d,
      projectName: projectMap[d.projectId] ?? "Unknown",
      createdAt: d.createdAt.toISOString(),
    }))
  );
});

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get("/admin/audit-logs", async (_req, res) => {
  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(200);
  res.json(logs.map(formatAudit));
});

// ── System Settings ───────────────────────────────────────────────────────────
router.get("/admin/settings", async (_req, res) => {
  const settings = await db.select().from(systemSettingsTable).orderBy(systemSettingsTable.key);
  res.json(settings.map(formatSetting));
});

router.patch("/admin/settings", async (req, res) => {
  const body = UpdateSystemSettingsBody.parse(req.body);

  for (const { key, value } of body.settings) {
    await db
      .insert(systemSettingsTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: systemSettingsTable.key, set: { value, updatedAt: new Date() } });
  }

  await db.insert(auditLogsTable).values({
    action: "settings_change",
    resource: "system_settings",
    details: `Updated ${body.settings.length} setting(s)`,
    userEmail: "admin@deployify.app",
  });

  const settings = await db.select().from(systemSettingsTable).orderBy(systemSettingsTable.key);
  res.json(settings.map(formatSetting));
});

export default router;
