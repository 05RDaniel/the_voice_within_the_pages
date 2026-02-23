import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

/**
 * Lee la configuración SMTP desde process.env en el momento de usar (permite
 * que dotenv se cargue después de importar este módulo, p. ej. en scripts).
 */
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

/**
 * Crea el transporter de Nodemailer con SMTP de Hostinger (SSL/TLS).
 * Solo se inicializa si SMTP_USER y SMTP_PASS están definidos.
 */
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
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un correo electrónico usando la configuración SMTP (Hostinger).
 *
 * @param to - Dirección o direcciones de destino (string o array de strings)
 * @param subject - Asunto del correo
 * @param htmlBody - Cuerpo del correo en HTML
 * @returns Resultado con success, messageId en caso de éxito o error en caso de fallo
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  htmlBody: string
): Promise<SendEmailResult> {
  const trans = getTransporter();
  if (!trans) {
    console.warn("[Email] Envío omitido (SMTP no configurado):", { to, subject });
    return { success: false, error: "SMTP no configurado" };
  }

  const from = getSmtpConfig().from;
  if (!from) {
    console.error("[Email] No se puede enviar: EMAIL_FROM o SMTP_USER no definido.");
    return { success: false, error: "Remitente no configurado" };
  }

  try {
    const result = await trans.sendMail({
      from: `"La voz de las páginas" <${from}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: htmlBody,
    });

    console.log("[Email] Enviado correctamente:", {
      to: Array.isArray(to) ? to : [to],
      subject,
      messageId: result.messageId,
    });

    return { success: true, messageId: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Error al enviar:", { to, subject, error: message });
    return { success: false, error: message };
  }
}
