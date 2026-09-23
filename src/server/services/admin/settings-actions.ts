"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/services/auth/rbac";
import { getStoreSettings, setStoreSettings } from "@/server/services/settings/store-settings";
import { storeIdentitySchema } from "@/server/services/admin/settings-schema";
import type { StoreIdentityValues } from "@/server/services/admin/settings-schema";

/**
 * Write side for /admin/settings (store identity).
 *
 * Gated on `settings.write` (SUPER_ADMIN/ADMIN only, per the seeded role map
 * — see rbac.ts) and audited the same way as product-actions.ts: the real
 * signed-in admin is the actor, never a placeholder.
 */

export interface SettingsActionResult {
  success: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

const IDENTITY_FIELDS: (keyof StoreIdentityValues)[] = [
  "name",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "email",
  "phone",
  "whatsapp",
  "cnpj",
  "address",
];

export async function updateStoreIdentity(input: unknown): Promise<SettingsActionResult> {
  const admin = await requirePermission("settings.write");

  const parsed = storeIdentitySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const before = await getStoreSettings();
  const data = parsed.data;

  try {
    await setStoreSettings(data, admin.id);

    const changes: Record<string, { before: string; after: string }> = {};
    for (const field of IDENTITY_FIELDS) {
      const beforeValue = String(before[field]);
      const afterValue = String(data[field]);
      if (beforeValue !== afterValue) {
        changes[field] = { before: beforeValue, after: afterValue };
      }
    }

    if (Object.keys(changes).length > 0) {
      await prisma.auditLog.create({
        data: {
          actorType: "USER",
          actorId: admin.id,
          actorLabel: `${admin.adminUser.name} <${admin.email}>`,
          action: "settings.update",
          entityType: "SystemSetting",
          entityId: "identity",
          changes,
        },
      });
    }

    // Every page that reads getStoreSettings() (layout, header/footer,
    // product/cart pages) needs the new value on next render.
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erro inesperado ao salvar as configurações.";
}
