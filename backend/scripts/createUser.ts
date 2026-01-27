import { PrismaClient } from "@prisma/client";
import { hashPassword, normalizeEmail, normalizeUsername } from "../src/utils/passwordUtils";

const prisma = new PrismaClient();

async function createUser() {
  try {
    const username = "dronkus";
    const email = "dronkus@ej.com";
    const password = "admin123";

    // Normalizar datos
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername }
        ],
      },
    });

    if (existingUser) {
      console.log("❌ El usuario ya existe en la base de datos");
      console.log("Usuario existente:", {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
      });
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    console.log("✅ Usuario creado exitosamente:");
    console.log({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();

