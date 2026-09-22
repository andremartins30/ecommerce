import { expect, test } from "@playwright/test";

/**
 * Sentinel for the E2E suite: proves Playwright can boot the app and drive a
 * real browser against it. The full journeys (ready-stock purchase,
 * made-to-order production tracking, mixed cart, failed payment releasing a
 * reservation, admin RBAC + MFA) are built in the final task.
 */
test("the storefront responds and renders", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();
});
