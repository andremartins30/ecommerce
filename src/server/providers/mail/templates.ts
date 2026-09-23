import type { MailMessage } from "@/server/providers/mail/types";

/**
 * The two authentication emails this task covers.
 *
 * Plain, inline templates — not the admin-editable NotificationTemplate
 * model. That model exists for the full notification system (task 30, which
 * covers order/production/shipping copy edited from the admin); these two
 * are fixed, security-sensitive flows that ship with the code rather than
 * being customisable content.
 */

interface StoreBranding {
  name: string;
  email: string;
}

function footer(store: StoreBranding): { html: string; text: string } {
  return {
    html: `<p style="color:#6b7280;font-size:12px;margin-top:24px;">
      Você recebeu este e-mail porque uma ação foi solicitada em ${escapeHtml(store.name)}.
      Se não foi você, pode ignorar esta mensagem com segurança.
    </p>`,
    text: `Você recebeu este e-mail porque uma ação foi solicitada em ${store.name}. Se não foi você, pode ignorar esta mensagem com segurança.`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

export function emailVerificationTemplate(params: {
  to: string;
  verificationUrl: string;
  store: StoreBranding;
}): MailMessage {
  const { to, verificationUrl, store } = params;
  const f = footer(store);

  return {
    to,
    subject: `Confirme seu e-mail — ${store.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h1 style="font-size:20px;">Confirme seu e-mail</h1>
        <p>Obrigado por criar sua conta na ${escapeHtml(store.name)}. Clique no botão abaixo para confirmar seu e-mail.</p>
        <p style="margin:24px 0;">
          <a href="${verificationUrl}" style="background:#1B1B1F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
            Confirmar e-mail
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Ou copie e cole este link no navegador:<br>${verificationUrl}</p>
        <p style="color:#6b7280;font-size:13px;">Este link expira em 24 horas.</p>
        ${f.html}
      </div>
    `,
    text: [
      "Confirme seu e-mail",
      `Obrigado por criar sua conta na ${store.name}. Acesse o link abaixo para confirmar seu e-mail:`,
      verificationUrl,
      "Este link expira em 24 horas.",
      "",
      f.text,
    ].join("\n\n"),
  };
}

export function passwordResetTemplate(params: {
  to: string;
  resetUrl: string;
  store: StoreBranding;
}): MailMessage {
  const { to, resetUrl, store } = params;
  const f = footer(store);

  return {
    to,
    subject: `Redefinir sua senha — ${store.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h1 style="font-size:20px;">Redefinir sua senha</h1>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta na ${escapeHtml(store.name)}. Clique no botão abaixo para escolher uma nova senha.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#1B1B1F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Ou copie e cole este link no navegador:<br>${resetUrl}</p>
        <p style="color:#6b7280;font-size:13px;">Este link expira em 1 hora e só pode ser usado uma vez.</p>
        ${f.html}
      </div>
    `,
    text: [
      "Redefinir sua senha",
      `Recebemos uma solicitação para redefinir a senha da sua conta na ${store.name}. Acesse o link abaixo para escolher uma nova senha:`,
      resetUrl,
      "Este link expira em 1 hora e só pode ser usado uma vez.",
      "",
      f.text,
    ].join("\n\n"),
  };
}
