/**
 * Mail transport abstraction.
 *
 * This is the interface every driver (fake, SES, SMTP) implements. The
 * caller never knows which one is behind it — that decision is made once, in
 * the factory (./index.ts), based on `MAIL_PROVIDER`. This is a transport
 * only: templates (subject/body) are built separately (./templates.ts) and
 * handed to `send()` already rendered.
 *
 * Deliberately narrow scope for task 17 — just enough to deliver the two
 * authentication emails (verification, password reset). A queue, retry/DLQ,
 * delivery tracking and admin-editable templates belong to the full
 * NotificationService (task 30), which is a different, larger surface
 * (see the `Notification`/`NotificationTemplate` models in schema.prisma).
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}
