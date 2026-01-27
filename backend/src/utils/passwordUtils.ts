import bcrypt from "bcryptjs";

/**
 * Valida que la contraseña no esté vacía
 * Sin restricciones de fortaleza - el usuario puede usar cualquier contraseña
 */
export const validatePasswordStrength = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length === 0) {
    return {
      valid: false,
      error: "La contraseña no puede estar vacía"
    };
  }

  // Sin restricciones adicionales - acepta cualquier contraseña
  return { valid: true };
};

/**
 * Hashea una contraseña de forma segura
 * Usa 12 rounds de bcrypt para mayor seguridad
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Usar 12 rounds en lugar de 10 para mayor seguridad
  // 12 rounds es un buen balance entre seguridad y rendimiento
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verifica una contraseña contra un hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Normaliza un email (lowercase y trim)
 */
export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Normaliza un username (trim y validación básica)
 */
export const normalizeUsername = (username: string): string => {
  return username.trim();
};

