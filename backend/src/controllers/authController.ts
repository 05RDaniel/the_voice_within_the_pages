import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  normalizeEmail,
  normalizeUsername,
} from "../utils/passwordUtils";

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
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Normalizar datos
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "El formato del email no es válido" });
    }

    // Validar formato de username (solo letras, números, guiones y guiones bajos)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return res.status(400).json({
        error: "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos"
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Verificar si el username ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }

    // Hash seguro de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario con datos normalizados
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    // Crear sesión
    (req.session as any).userId = user.id;
    (req.session as any).userEmail = user.email;

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
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
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ user });
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