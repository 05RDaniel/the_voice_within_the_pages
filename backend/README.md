# La voz de las páginas - Backend

API REST construida con Express.js, TypeScript, PostgreSQL y Prisma.

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
# Edita .env con tus credenciales de PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/la_voz_de_las_paginas"
```

3. **Configurar base de datos:**
```bash
npx prisma generate
npx prisma db push
# o
npx prisma migrate dev
```

4. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## 📁 Estructura

```
backend/
├── src/
│   ├── controllers/    # Controladores de lógica de negocio
│   ├── middleware/    # Middlewares (auth, validation, etc.)
│   ├── routes/        # Definición de rutas
│   ├── utils/         # Utilidades
│   ├── types/         # Tipos TypeScript
│   └── index.ts       # Punto de entrada
├── prisma/
│   └── schema.prisma  # Esquema de base de datos
└── dist/              # Código compilado (generado)
```

## 🔐 Autenticación

El proyecto está preparado para usar tanto **Session-based** como **JWT**. 

- **Session-based**: Ya configurado en `src/index.ts`
- **JWT**: Descomenta y configura en `src/middleware/auth.ts`

## 📝 Scripts

- `npm run dev` - Desarrollo con hot reload (tsx watch)
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar en producción
- `npm run db:generate` - Generar Prisma Client
- `npm run db:push` - Sincronizar esquema con DB
- `npm run db:migrate` - Crear migración
- `npm run db:studio` - Abrir Prisma Studio

## 🗄️ Modelos de Base de Datos

- **User**: Usuarios del sistema
- **Content**: Contenido de texto por usuario



