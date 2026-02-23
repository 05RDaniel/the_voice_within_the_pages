# 🚀 Inicio Rápido - La voz de las páginas

## Instalación Completa

### 1. Instalar dependencias de la raíz
```bash
npm install
```

### 2. Backend

```bash
cd backend
npm install

# Configurar .env (edita con tus credenciales de PostgreSQL)
# DATABASE_URL="postgresql://user:password@localhost:5432/la_voz_de_las_paginas"

# Generar Prisma Client
npx prisma generate

# Crear base de datos y tablas
npx prisma db push
# o para migraciones:
# npx prisma migrate dev --name init

# Iniciar servidor
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install

# Configurar .env (opcional)
# VITE_API_URL=http://localhost:5000

# Iniciar servidor
npm run dev
```

## Ejecutar Todo Junto

Desde la raíz del proyecto:
```bash
npm run dev
```

Esto ejecutará frontend y backend simultáneamente.

## Verificación

- ✅ Backend: http://localhost:5000/health
- ✅ Frontend: http://localhost:5173

## Próximos Pasos

1. Implementar rutas de autenticación en `backend/src/routes/`
2. Crear controladores en `backend/src/controllers/`
3. Implementar funcionalidad de texto a voz
4. Crear componentes React para la interfaz

## Notas

- El backend está configurado para usar **Session-based** por defecto
- Puedes cambiar a **JWT** editando `backend/src/middleware/auth.ts`
- El esquema de Prisma incluye modelos User y Content



