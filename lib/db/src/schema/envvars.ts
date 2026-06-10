import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const envVarEnvEnum = pgEnum("env_var_env", ["production", "preview", "development", "all"]);

export const envVarsTable = pgTable("env_vars", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  environment: envVarEnvEnum("environment").notNull().default("all"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEnvVarSchema = createInsertSchema(envVarsTable).omit({ id: true, createdAt: true });
export type InsertEnvVar = z.infer<typeof insertEnvVarSchema>;
export type EnvVar = typeof envVarsTable.$inferSelect;
