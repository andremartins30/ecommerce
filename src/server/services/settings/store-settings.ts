import { prisma } from "@/server/db/client";
import { DEFAULT_PRODUCTION_LEAD_TIME_DAYS } from "@/server/domain/availability/availability";
import type { ShipmentPolicy, StoreSettings } from "@/lib/types";

/**
 * Store configuration, read from SystemSetting.
 *
 * Every value has a defensive fallback: a missing or malformed row must never
 * take the storefront down, and it must never silently produce a *wrong*
 * commercial promise either — the fallbacks are the same conservative defaults
 * the seed writes.
 *
 * Cached per request. Next dedupes within a render pass, and these values change
 * rarely; a stale value for the remainder of one request is harmless.
 */

const DEFAULTS: StoreSettings = {
  name: "Perfumaria",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#1B1B1F",
  email: "",
  phone: "",
  whatsapp: "",
  cnpj: "",
  address: "",
  defaultProductionLeadTimeDays: DEFAULT_PRODUCTION_LEAD_TIME_DAYS,
  handlingDays: 1,
  shipmentPolicy: "SINGLE_SHIPMENT",
  freeShippingThresholdCents: 29_900,
  flatShippingCents: 2_490,
  expressShippingCents: 4_990,
  lowStockThreshold: 3,
  contratipoDisclaimer:
    "Fragrância inspirada no perfil olfativo de {{referencia}}. Este produto não possui vínculo com a marca mencionada.",
  enabledPaymentMethods: ["PIX"],
  maxInstallments: 1,
};

const KEYS = {
  name: "store.name",
  logoUrl: "store.logoUrl",
  faviconUrl: "store.faviconUrl",
  primaryColor: "store.primaryColor",
  email: "store.email",
  phone: "store.phone",
  whatsapp: "store.whatsapp",
  cnpj: "store.cnpj",
  address: "store.address",
  defaultProductionLeadTimeDays: "production.defaultLeadTimeDays",
  handlingDays: "production.handlingDays",
  shipmentPolicy: "shipping.policy",
  freeShippingThresholdCents: "shipping.freeShippingThresholdCents",
  flatShippingCents: "shipping.flatRateCents",
  expressShippingCents: "shipping.expressRateCents",
  lowStockThreshold: "catalogue.lowStockThreshold",
  contratipoDisclaimer: "legal.contratipoDisclaimer",
  enabledPaymentMethods: "payment.enabledMethods",
  maxInstallments: "payment.maxInstallments",
} as const satisfies Record<keyof StoreSettings, string>;

function readInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function readString(raw: string | undefined, fallback: string): string {
  return raw === undefined ? fallback : raw;
}

function readShipmentPolicy(raw: string | undefined): ShipmentPolicy {
  return raw === "SPLIT_SHIPMENT" ? "SPLIT_SHIPMENT" : "SINGLE_SHIPMENT";
}

function readStringArray(raw: string | undefined, fallback: string[]): string[] {
  if (raw === undefined) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    // A malformed setting falls back rather than breaking the page.
  }
  return fallback;
}

/** Builds settings from raw key/value pairs. Pure, so it is directly testable. */
export function buildStoreSettings(raw: Map<string, string>): StoreSettings {
  return {
    name: readString(raw.get(KEYS.name), DEFAULTS.name) || DEFAULTS.name,
    logoUrl: readString(raw.get(KEYS.logoUrl), DEFAULTS.logoUrl),
    faviconUrl: readString(raw.get(KEYS.faviconUrl), DEFAULTS.faviconUrl),
    primaryColor: readString(raw.get(KEYS.primaryColor), DEFAULTS.primaryColor),
    email: readString(raw.get(KEYS.email), DEFAULTS.email),
    phone: readString(raw.get(KEYS.phone), DEFAULTS.phone),
    whatsapp: readString(raw.get(KEYS.whatsapp), DEFAULTS.whatsapp),
    cnpj: readString(raw.get(KEYS.cnpj), DEFAULTS.cnpj),
    address: readString(raw.get(KEYS.address), DEFAULTS.address),
    defaultProductionLeadTimeDays: readInt(
      raw.get(KEYS.defaultProductionLeadTimeDays),
      DEFAULTS.defaultProductionLeadTimeDays
    ),
    handlingDays: readInt(raw.get(KEYS.handlingDays), DEFAULTS.handlingDays),
    shipmentPolicy: readShipmentPolicy(raw.get(KEYS.shipmentPolicy)),
    freeShippingThresholdCents: readInt(
      raw.get(KEYS.freeShippingThresholdCents),
      DEFAULTS.freeShippingThresholdCents
    ),
    flatShippingCents: readInt(raw.get(KEYS.flatShippingCents), DEFAULTS.flatShippingCents),
    expressShippingCents: readInt(raw.get(KEYS.expressShippingCents), DEFAULTS.expressShippingCents),
    lowStockThreshold: readInt(raw.get(KEYS.lowStockThreshold), DEFAULTS.lowStockThreshold),
    contratipoDisclaimer:
      readString(raw.get(KEYS.contratipoDisclaimer), DEFAULTS.contratipoDisclaimer) ||
      DEFAULTS.contratipoDisclaimer,
    enabledPaymentMethods: readStringArray(
      raw.get(KEYS.enabledPaymentMethods),
      DEFAULTS.enabledPaymentMethods
    ),
    maxInstallments: readInt(raw.get(KEYS.maxInstallments), DEFAULTS.maxInstallments),
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.systemSetting.findMany({ select: { key: true, value: true } });
  return buildStoreSettings(new Map(rows.map((row) => [row.key, row.value])));
}

export const STORE_SETTING_KEYS = KEYS;
export const STORE_SETTING_DEFAULTS = DEFAULTS;

/**
 * Fills the `{{referencia}}` placeholder of the contratipo disclaimer.
 *
 * Kept here rather than in a component so every surface that shows the notice —
 * product page, cart, SEO description — renders exactly the same sentence.
 */
export function renderContratipoDisclaimer(
  template: string,
  referenceBrand: string | null,
  referenceFragrance: string | null
): string {
  const reference = [referenceBrand, referenceFragrance].filter(Boolean).join(" ");
  return template.replace(/\{\{\s*referencia\s*\}\}/gi, reference || "outra fragrância");
}
