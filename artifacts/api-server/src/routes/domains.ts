import { Router } from "express";
import { db } from "@workspace/db";
import { domainsTable, dnsRecordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateDomainBody,
  GetDomainParams,
  DeleteDomainParams,
  VerifyDomainParams,
  ListDnsRecordsParams,
  CreateDnsRecordBody,
  CreateDnsRecordParams,
  UpdateDnsRecordBody,
  UpdateDnsRecordParams,
  DeleteDnsRecordParams,
} from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

function formatDomain(d: typeof domainsTable.$inferSelect) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
  };
}

function formatDnsRecord(r: typeof dnsRecordsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
  };
}

// List domains
router.get("/domains", async (_req, res) => {
  const domains = await db.select().from(domainsTable).orderBy(domainsTable.createdAt);
  res.json(domains.map(formatDomain));
});

// Create domain
router.post("/domains", async (req, res) => {
  const body = CreateDomainBody.parse(req.body);
  const verificationToken = "deployify-verify-" + crypto.randomBytes(8).toString("hex");
  const [domain] = await db
    .insert(domainsTable)
    .values({ name: body.name, projectId: body.projectId ?? null, verificationToken, status: "pending", verified: false, sslStatus: "pending" })
    .returning();

  // Seed default DNS records
  await db.insert(dnsRecordsTable).values([
    { domainId: domain.id, type: "A", name: "@", value: "76.76.21.21", ttl: 3600 },
    { domainId: domain.id, type: "CNAME", name: "www", value: domain.name, ttl: 3600 },
  ]);

  res.status(201).json(formatDomain(domain));
});

// Get domain
router.get("/domains/:id", async (req, res) => {
  const { id } = GetDomainParams.parse({ id: Number(req.params.id) });
  const [domain] = await db.select().from(domainsTable).where(eq(domainsTable.id, id));
  if (!domain) return res.status(404).json({ error: "Not found" });
  res.json(formatDomain(domain));
});

// Delete domain
router.delete("/domains/:id", async (req, res) => {
  const { id } = DeleteDomainParams.parse({ id: Number(req.params.id) });
  await db.delete(domainsTable).where(eq(domainsTable.id, id));
  res.status(204).send();
});

// Verify domain
router.post("/domains/:id/verify", async (req, res) => {
  const { id } = VerifyDomainParams.parse({ id: Number(req.params.id) });
  const [domain] = await db
    .update(domainsTable)
    .set({ verified: true, status: "active", sslStatus: "active" })
    .where(eq(domainsTable.id, id))
    .returning();
  if (!domain) return res.status(404).json({ error: "Not found" });
  res.json(formatDomain(domain));
});

// List DNS records
router.get("/domains/:domainId/records", async (req, res) => {
  const { domainId } = ListDnsRecordsParams.parse({ domainId: Number(req.params.domainId) });
  const records = await db.select().from(dnsRecordsTable).where(eq(dnsRecordsTable.domainId, domainId));
  res.json(records.map(formatDnsRecord));
});

// Create DNS record
router.post("/domains/:domainId/records", async (req, res) => {
  const { domainId } = CreateDnsRecordParams.parse({ domainId: Number(req.params.domainId) });
  const body = CreateDnsRecordBody.parse(req.body);
  const [record] = await db
    .insert(dnsRecordsTable)
    .values({ domainId, ...body, ttl: body.ttl ?? 3600 })
    .returning();
  res.status(201).json(formatDnsRecord(record));
});

// Update DNS record
router.patch("/domains/:domainId/records/:recordId", async (req, res) => {
  const { recordId } = UpdateDnsRecordParams.parse({
    domainId: Number(req.params.domainId),
    recordId: Number(req.params.recordId),
  });
  const body = UpdateDnsRecordBody.parse(req.body);
  const [record] = await db
    .update(dnsRecordsTable)
    .set(body)
    .where(eq(dnsRecordsTable.id, recordId))
    .returning();
  if (!record) return res.status(404).json({ error: "Not found" });
  res.json(formatDnsRecord(record));
});

// Delete DNS record
router.delete("/domains/:domainId/records/:recordId", async (req, res) => {
  const { recordId } = DeleteDnsRecordParams.parse({
    domainId: Number(req.params.domainId),
    recordId: Number(req.params.recordId),
  });
  await db.delete(dnsRecordsTable).where(eq(dnsRecordsTable.id, recordId));
  res.status(204).send();
});

export default router;
