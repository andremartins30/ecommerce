import { getEnv } from "@/server/env";
import { FakeMailProvider } from "@/server/providers/mail/fake-mail-provider";
import type { MailProvider } from "@/server/providers/mail/types";

export type { MailProvider, MailMessage } from "@/server/providers/mail/types";
export { emailVerificationTemplate, passwordResetTemplate } from "@/server/providers/mail/templates";

let cached: MailProvider | undefined;

/**
 * Resolves the mail driver from `MAIL_PROVIDER`, the same pattern every other
 * provider slot (payment, shipping, fiscal, storage, cep) follows: one
 * interface, one env-selected driver, real ones added as their own module
 * without the caller changing.
 *
 * SES and SMTP are real integrations still to be built — they intentionally
 * throw rather than silently falling back to the fake, so a misconfigured
 * production deploy fails loudly instead of writing files nobody reads.
 */
export function getMailProvider(): MailProvider {
  if (cached) return cached;

  const env = getEnv();

  switch (env.MAIL_PROVIDER) {
    case "fake":
      cached = new FakeMailProvider();
      return cached;
    case "ses":
      throw new Error("MAIL_PROVIDER=ses is not implemented yet.");
    case "smtp":
      throw new Error("MAIL_PROVIDER=smtp is not implemented yet.");
  }
}

/** Test-only: forget the cached provider. */
export function resetMailProviderCache(): void {
  cached = undefined;
}
