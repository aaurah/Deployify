import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { domainsTable } from "./domains";

export const dnsRecordTypeEnum = pgEnum("dns_record_type", ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"]);

export const dnsRecordsTable = pgTable("dns_records", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull().references(() => domainsTable.id, { onDelete: "cascade" }),
  type: dnsRecordTypeEnum("type").notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  ttl: integer("ttl").notNull().default(3600),
  priority: integer("priority"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDnsRecordSchema = createInsertSchema(dnsRecordsTable).omit({ id: true, createdAt: true });
export type InsertDnsRecord = z.infer<typeof insertDnsRecordSchema>;
export type DnsRecord = typeof dnsRecordsTable.$inferSelect;
