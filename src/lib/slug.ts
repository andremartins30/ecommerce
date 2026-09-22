/**
 * Turns a display name into a URL-safe slug (lowercase, hyphen-separated,
 * accents stripped). Shared between admin forms and anything else that needs
 * a slug — not tied to the mock seed data.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
