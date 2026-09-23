import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MailMessage, MailProvider } from "@/server/providers/mail/types";

/**
 * Development driver: writes every message to `.mail-outbox/` instead of
 * sending it. This is what `MAIL_PROVIDER=fake` resolves to — the same
 * dev-only driver env.ts already rejects at boot when `NODE_ENV=production`
 * (see DEV_ONLY_DRIVERS), so this file can never run against real traffic.
 *
 * One file per message, human-readable (subject + both bodies), so a
 * developer can open `.mail-outbox/` and read exactly what would have been
 * sent, including the verification/reset link, without needing a real inbox
 * or a mail-catcher service.
 */

const OUTBOX_DIR = join(process.cwd(), ".mail-outbox");

function safeFileNamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9@._-]/g, "_");
}

export class FakeMailProvider implements MailProvider {
  async send(message: MailMessage): Promise<void> {
    await mkdir(OUTBOX_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${timestamp}-${safeFileNamePart(message.to)}.txt`;

    const contents = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      `Date: ${new Date().toISOString()}`,
      "",
      "--- TEXT ---",
      message.text,
      "",
      "--- HTML ---",
      message.html,
    ].join("\n");

    await writeFile(join(OUTBOX_DIR, fileName), contents, "utf-8");

    console.log(`[mail:fake] wrote ${fileName} (to: ${message.to}, subject: "${message.subject}")`);
  }
}
