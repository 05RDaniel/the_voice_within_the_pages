import nodemailer from "nodemailer";
import { Resend } from "resend";

let transporter: nodemailer.Transporter | null = null;

const SMTP_CONNECTION_TIMEOUT_MS = 15_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE !== "false",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  };
}

function getTransporter(): nodemailer.Transporter | null {
  const config = getSmtpConfig();
  if (transporter) return transporter;

  if (!config.user || !config.pass) {
    console.warn("[Email] SMTP no configurado: faltan SMTP_USER o SMTP_PASS en .env. Los correos no se enviarán.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
  });

  return transporter;
}

/** Si existe RESEND_API_KEY se usa Resend (HTTPS); en Render evita el bloqueo de SMTP. */
function useResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "onboarding@resend.dev";
}

async function sendEmailResend(
  to: string | string[],
  subject: string,
  htmlBody: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY no configurado" };
  }

  const from = getFromAddress();
  const toList = Array.isArray(to) ? to : [to];
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: `"La voz de las páginas" <${from}>`,
      to: toList,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error("[Email] Resend error:", { to: toList, subject, error });
      return { success: false, error: error.message };
    }
    console.log("[Email] Enviado (Resend):", { to: toList, subject, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Resend exception:", { to: toList, subject, error: message });
    return { success: false, error: message };
  }
}

/**
 * Envía un correo.
 * - Con RESEND_API_KEY: usa Resend (recomendado en Render; no depende de SMTP).
 * - Sin él: usa SMTP (Hostinger, etc.). En Render los puertos SMTP suelen estar bloqueados.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  htmlBody: string
): Promise<SendEmailResult> {
  if (useResend()) {
    return sendEmailResend(to, subject, htmlBody);
  }

  const trans = getTransporter();
  if (!trans) {
    console.warn("[Email] Envío omitido (SMTP no configurado):", { to, subject });
    return { success: false, error: "SMTP no configurado" };
  }

  const from = getSmtpConfig().from;
  if (!from) {
    console.error("[Email] EMAIL_FROM o SMTP_USER no definido.");
    return { success: false, error: "Remitente no configurado" };
  }

  try {
    const result = await trans.sendMail({
      from: `"La voz de las páginas" <${from}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: htmlBody,
    });
    console.log("[Email] Enviado (SMTP):", { to: Array.isArray(to) ? to : [to], subject, messageId: result.messageId });
    return { success: true, messageId: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] SMTP error:", { to, subject, error: message });
    return { success: false, error: message };
  }
}
