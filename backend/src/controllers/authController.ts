import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  normalizeEmail,
  normalizeUsername,
} from "../utils/passwordUtils";

const VERIFICATION_CODE_EXPIRY_HOURS = 24;

function generateVerificationCode(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: "Usuario/Email y contraseña son requeridos" });
    }

    // Determinar si es email o username (email contiene @ y tiene formato válido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(usernameOrEmail);
    
    // Normalizar entrada
    const normalizedInput = isEmail
      ? normalizeEmail(usernameOrEmail)
      : normalizeUsername(usernameOrEmail);

    // Buscar usuario por email o username
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: normalizedInput }
        : { username: normalizedInput },
    });

    if (!user) {
      // Usar el mismo mensaje para evitar enumeración de usuarios
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña de forma segura
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Debes verificar tu correo electrónico para acceder",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    // Crear sesión
    (req.session as any).userId = user.id;
    (req.session as any).userEmail = user.email;
    (req.session as any).username = user.username;

    res.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

export const register = async (req: Request, res: Response) => {
  const log = (msg: string, data?: object) => console.log("[Auth:register]", msg, data ?? "");
  try {
    log("request received", { hasBody: Boolean(req.body), keys: req.body ? Object.keys(req.body) : [] });
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      log("validation failed: missing fields", { hasUsername: Boolean(username), hasEmail: Boolean(email), hasPassword: Boolean(password) });
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      log("validation failed: password strength", { error: passwordValidation.error });
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Normalizar datos
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);
    log("normalized input", { normalizedEmail, normalizedUsername });

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      log("validation failed: invalid email format");
      return res.status(400).json({ error: "El formato del email no es válido" });
    }

    // Validar formato de username (solo letras, números, guiones y guiones bajos)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      log("validation failed: invalid username format");
      return res.status(400).json({
        error: "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos"
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      log("rejected: email already exists", { email: normalizedEmail });
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Verificar si el username ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      log("rejected: username already taken", { username: normalizedUsername });
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }

    // Hash seguro de la contraseña
    log("hashing password");
    const hashedPassword = await hashPassword(password);

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_HOURS * 60 * 60 * 1000);
    log("creating user", { email: normalizedEmail, username: normalizedUsername, codeExpiresAt: expiresAt.toISOString() });

    // Crear usuario (sin sesión hasta verificar correo)
    await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationCode,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    });
    log("user created, sending verification email");

    const verifySubject = "Tu código de verificación — La voz de las páginas";
    const verifyHtml = `
      <h2>Hola, ${normalizedUsername}</h2>
      <p>Tu código de verificación para <strong>La voz de las páginas</strong> es:</p>
      <p style="font-size:1.5rem;font-weight:700;letter-spacing:0.3em;margin:1rem 0;">${verificationCode}</p>
      <p>Introduce este código en la web para activar tu cuenta. El código caduca en 24 horas.</p>
      <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
      <p>— El equipo</p>
    `;
    sendEmail(normalizedEmail, verifySubject, verifyHtml).then((result) => {
      if (!result.success) {
        console.error("[Auth:register] email send failed", { to: normalizedEmail, error: result.error });
      } else {
        log("verification email sent", { to: normalizedEmail, messageId: result.messageId });
      }
    });

    log("register success, responding 201", { email: normalizedEmail });
    res.status(201).json({
      message: "Revisa tu correo para verificar tu cuenta",
      needsVerification: true,
    });
  } catch (error) {
    console.error("[Auth:register] error", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const log = (msg: string, data?: object) => console.log("[Auth:verifyEmail]", msg, data ?? "");
  try {
    log("request received", { hasBody: Boolean(req.body) });
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail((email || "").trim());
    const codeStr = String(code || "").trim().replace(/\s/g, "");

    if (!normalizedEmail || !codeStr) {
      log("validation failed: missing email or code", { hasEmail: Boolean(normalizedEmail), codeLength: codeStr.length });
      return res.status(400).json({ error: "Email y código son requeridos" });
    }

    if (!/^\d{6}$/.test(codeStr)) {
      log("validation failed: code not 6 digits", { codeLength: codeStr.length });
      return res.status(400).json({ error: "El código debe tener 6 dígitos" });
    }
    log("looking up user", { email: normalizedEmail });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      log("rejected: user not found", { email: normalizedEmail });
      return res.status(400).json({ error: "Código inválido o caducado" });
    }

    if (user.emailVerified) {
      log("already verified", { userId: user.id });
      return res.status(200).json({
        message: "Tu cuenta ya está verificada; puedes iniciar sesión.",
        code: "ALREADY_VERIFIED",
      });
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== codeStr) {
      log("rejected: token mismatch", { userId: user.id, hasStoredToken: Boolean(user.emailVerificationToken) });
      return res.status(400).json({ error: "Código inválido o caducado" });
    }

    if (!user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < new Date()) {
      log("rejected: token expired", { userId: user.id, expiresAt: user.emailVerificationTokenExpiresAt?.toISOString() });
      return res.status(400).json({ error: "El código ha caducado. Solicita uno nuevo." });
    }

    log("updating user to verified", { userId: user.id });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    log("verify success", { userId: user.id });
    res.json({ message: "Correo verificado correctamente" });
  } catch (error) {
    console.error("[Auth:verifyEmail] error", error);
    res.status(500).json({ error: "Error al verificar el correo" });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  const log = (msg: string, data?: object) => console.log("[Auth:resendVerification]", msg, data ?? "");
  try {
    log("request received", { hasBody: Boolean(req.body) });
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email || "");

    if (!normalizedEmail) {
      log("validation failed: missing email");
      return res.status(400).json({ error: "El email es requerido" });
    }
    log("looking up user", { email: normalizedEmail });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      log("rejected: user not found", { email: normalizedEmail });
      return res.status(404).json({ error: "No existe ninguna cuenta con ese correo" });
    }

    if (user.emailVerified) {
      log("rejected: already verified", { userId: user.id });
      return res.status(400).json({ error: "Esta cuenta ya está verificada" });
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_HOURS * 60 * 60 * 1000);
    log("updating token", { userId: user.id, expiresAt: expiresAt.toISOString() });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationCode,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    });

    const verifySubject = "Tu nuevo código de verificación — La voz de las páginas";
    const verifyHtml = `
      <h2>Hola, ${user.username}</h2>
      <p>Tu nuevo código de verificación es:</p>
      <p style="font-size:1.5rem;font-weight:700;letter-spacing:0.3em;margin:1rem 0;">${verificationCode}</p>
      <p>Introduce este código en la web. El código caduca en 24 horas.</p>
      <p>Si no fuiste tú, puedes ignorar este mensaje.</p>
      <p>— El equipo</p>
    `;
    log("sending email");
    const result = await sendEmail(normalizedEmail, verifySubject, verifyHtml);
    if (!result.success) {
      console.error("[Auth:resendVerification] email send failed", { to: normalizedEmail, error: result.error });
      return res.status(500).json({ error: "No se pudo enviar el correo. Inténtalo más tarde." });
    }
    log("success", { to: normalizedEmail, messageId: result.messageId });
    res.json({ message: "Se ha enviado un nuevo correo de verificación" });
  } catch (error) {
    console.error("[Auth:resendVerification] error", error);
    res.status(500).json({ error: "Error al reenviar el correo" });
  }
};

export const logout = async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada exitosamente" });
  });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(200).json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.emailVerified) {
      req.session.destroy(() => {});
      return res.status(403).json({
        error: "Debes verificar tu correo electrónico para acceder",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const { emailVerified: _, ...userWithoutVerified } = user;
    res.json({ user: userWithoutVerified });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Error al obtener información del usuario" });
  }
};

export const updateProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { profileImage } = req.body;

    if (!profileImage) {
      return res.status(400).json({ error: "No se proporcionó imagen" });
    }

    // Validate that it's a valid base64 image
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    if (!base64Regex.test(profileImage)) {
      return res.status(400).json({ error: "Formato de imagen no válido" });
    }

    // Check image size (limit to ~2MB in base64)
    if (profileImage.length > 2 * 1024 * 1024 * 1.37) {
      return res.status(400).json({ error: "La imagen es demasiado grande (máximo 2MB)" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
    });

    res.json({ 
      message: "Imagen de perfil actualizada",
      user 
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({ error: "Error al actualizar la imagen de perfil" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }

    // Check that new password is different from current
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "La nueva contraseña debe ser diferente a la actual" });
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
};