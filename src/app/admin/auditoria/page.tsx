import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "@/server/services/auth/session";
import { requirePermission } from "@/server/services/auth/rbac";
import { listAuditLogs, listAuditEntityTypes } from "@/server/services/admin/audit-queries";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export const metadata: Metadata = {
  title: "Auditoria",
};

/**
 * Restricted to `audit.read` (SUPER_ADMIN/ADMIN only, per the seeded role
 * map) — this page shows every actor's action history, not just the
 * viewer's own. requirePermission() throws AuthError for anyone else, which
 * is turned into a redirect here rather than an error page.
 */
export default async function AdminAuditPage() {
  try {
    await requirePermission("audit.read");
  } catch (error) {
    if (error instanceof AuthError) redirect("/admin");
    throw error;
  }

  // Filtered client-side over a bounded recent window, same pattern as the
  // other admin tables (inventory, products) — a dedicated search backend is
  // unnecessary at this scale, and this keeps every filter instantly
  // responsive instead of a round trip per keystroke.
  const [{ items, total }, entityTypes] = await Promise.all([
    listAuditLogs({ pageSize: 500 }),
    listAuditEntityTypes(),
  ]);

  return <AuditLogTable items={items} total={total} entityTypes={entityTypes} />;
}
