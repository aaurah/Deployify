import { pgTable, serial, text, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const domainStatusEnum = pgEnum("domain_status", ["pending", "active", "error", "expired"]);
export const sslStatusEnum = pgEnum("ssl_status", ["pending", "active", "error"]);

export const domainsTable = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: domainStatusEnum("status").notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  sslStatus: sslStatusEnum("ssl_status").notNull().default("pending"),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDomainSchema = createInsertSchema(domainsTable).omit({ id: true, createdAt: true });
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domainsTable.$inferSelect;
