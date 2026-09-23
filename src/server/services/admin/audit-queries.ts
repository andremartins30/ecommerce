import { prisma } from "@/server/db/client";

/**
 * Read side for /admin/auditoria. Gated on the `audit.read` permission (see
 * rbac.ts) — this is the one screen that exposes every actor's action
 * history, so it is intentionally restricted to SUPER_ADMIN/ADMIN in the
 * seeded role→permission map (prisma/seed.ts).
 */

export interface AuditLogItem {
  id: string;
  actorType: string;
  actorLabel: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ListAuditLogsFilters {
  action?: string;
  entityType?: string;
  /** Substring match against actorLabel — the id is not user-facing. */
  actor?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAuditLogsResult {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

export async function listAuditLogs(filters: ListAuditLogsFilters = {}): Promise<ListAuditLogsResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const where = {
    ...(filters.action ? { action: { contains: filters.action, mode: "insensitive" as const } } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.actor ? { actorLabel: { contains: filters.actor, mode: "insensitive" as const } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      actorType: row.actorType,
      actorLabel: row.actorLabel,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      changes: row.changes,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}

/** Distinct entity types seen so far, for the filter dropdown — avoids hardcoding a list that will drift as new actions get audited. */
export async function listAuditEntityTypes(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
  });
  return rows.map((r) => r.entityType);
}
