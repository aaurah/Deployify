import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const deploymentStatusEnum = pgEnum("deployment_status", ["queued", "building", "ready", "error", "cancelled"]);
export const deploymentEnvEnum = pgEnum("deployment_env", ["production", "preview", "development"]);

export const deploymentsTable = pgTable("deployments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  status: deploymentStatusEnum("status").notNull().default("queued"),
  environment: deploymentEnvEnum("environment").notNull().default("production"),
  branch: text("branch").notNull().default("main"),
  commitSha: text("commit_sha"),
  commitMessage: text("commit_message"),
  deployUrl: text("deploy_url"),
  buildDurationMs: integer("build_duration_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deploymentLogsTable = pgTable("deployment_logs", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").notNull().references(() => deploymentsTable.id, { onDelete: "cascade" }),
  level: text("level", { enum: ["info", "warn", "error"] }).notNull().default("info"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertDeploymentSchema = createInsertSchema(deploymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeploymentLogSchema = createInsertSchema(deploymentLogsTable).omit({ id: true, timestamp: true });
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deploymentsTable.$inferSelect;
export type DeploymentLog = typeof deploymentLogsTable.$inferSelect;
