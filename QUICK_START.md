# 🚀 Inicio Rápido - La voz de las páginas

## Instalación Completa

### 1. Instalar dependencias de la raíz
```bash
npm install
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configurar .env (edita con tus credenciales de PostgreSQL)
cp env.example .env
# DATABASE_URL="postgresql://user:password@localhost:5432/la_voz_de_las_paginas"

# Aplicar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --port 5000
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

1. Añadir nuevas rutas en `backend/app/routers/`
2. Añadir nuevos modelos en `backend/app/models/` y generar la migración con Alembic
3. Implementar funcionalidad de texto a voz
4. Crear componentes React para la interfaz

## Notas

- El backend está configurado para usar **Session-based** (cookie + tabla `sessions` en Postgres) por defecto
- La dependencia `require_user_id` en `backend/app/deps.py` protege las rutas autenticadas
- Los modelos SQLAlchemy incluyen User, Content, Quote, Story, Chapter, Character, Timeline, Note y Plot



