import { formatBRL } from "@/server/domain/pricing/money";

/**
 * Presentation formatting, pt-BR only.
 *
 * A fixed locale is deliberate: this is a Brazilian store, and letting the
 * runtime locale decide produced different output on the server and in the
 * browser, which breaks hydration.
 */

const TIME_ZONE = "America/Sao_Paulo";

/**
 * Formats an **integer amount in cents** as Brazilian currency.
 *
 * 24990 -> "R$ 249,90". Passing reais throws, which is the point: it is the
 * only way to catch the mistake at the moment it is made instead of shipping a
 * price that is 100x wrong.
 */
export function formatPrice(valueInCents: number): string {
  return formatBRL(valueInCents);
}

/** dd/MM/yyyy */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
    ...opts,
  }).format(new Date(iso));
}

/** dd/MM/yyyy HH:mm */
export function formatDateTime(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "18 de agosto de 2026" — for editorial copy, not tables. */
export function formatDateLong(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** "1 dia" / "15 dias" */
export function formatDays(days: number): string {
  return days === 1 ? "1 dia" : `${formatNumber(days)} dias`;
}

/**
 * Pluralises a count with its noun: (3, "unidade") -> "3 unidades".
 * Portuguese-only helper, kept here so components never inline this logic.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${formatNumber(count)} ${word}`;
}
