# La voz de las páginas - Backend (FastAPI)

API REST construida con FastAPI, SQLAlchemy (async) y PostgreSQL. Reescritura del backend original en Express/Prisma (conservado en `../backend-old/` para referencia durante la migración).

## Inicio rápido

1. **Crear entorno virtual e instalar dependencias:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. **Configurar variables de entorno:**
```bash
cp env.example .env
# Edita .env con tus credenciales de PostgreSQL y (opcionalmente) email
```

3. **Aplicar las migraciones:**
```bash
alembic upgrade head
```

4. **Iniciar el servidor de desarrollo:**
```bash
uvicorn app.main:app --reload --port 5000
```

El servidor estará disponible en `http://localhost:5000`. La documentación interactiva (Swagger) está en `http://localhost:5000/docs`.

## Estructura

```
backend/
├── app/
│   ├── main.py           # App FastAPI, CORS, routers, /health
│   ├── config.py         # Settings desde variables de entorno
│   ├── database.py       # Engine/sesión async de SQLAlchemy
│   ├── models/           # Modelos SQLAlchemy (User, Story, Chapter, ...)
│   ├── schemas/          # Modelos Pydantic de entrada
│   ├── routers/          # Endpoints por recurso
│   ├── core/
│   │   ├── security.py   # Hash de contraseñas (bcrypt), normalización
│   │   ├── session.py    # Sesión por cookie respaldada en tabla Postgres
│   │   └── errors.py     # ApiError + handlers para respuestas {error, code}
│   ├── email.py          # Envío de emails (Resend / SMTP)
│   └── serializers.py    # Helpers para dar forma exacta a las respuestas JSON
├── alembic/               # Migraciones
└── scripts/
    ├── seed_quotes.py
    └── create_user.py
```

## Autenticación

Autenticación por sesión de cookie (`session_id`), respaldada en la tabla `sessions` de Postgres (equivalente a lo que hacía `connect-pg-simple` en el backend Express). No se usa JWT.

## Scripts auxiliares

```bash
python -m scripts.seed_quotes   # Inserta las citas iniciales
python -m scripts.create_user   # Crea un usuario de bootstrap (dronkus/admin123)
```

## Migraciones

```bash
alembic upgrade head                        # Aplicar migraciones pendientes
alembic revision --autogenerate -m "..."    # Generar una nueva migración a partir de cambios en los modelos
```

## Modelos de base de datos

`User`, `Content`, `Quote`, `Story`, `Chapter`, `Character`, `Timeline`, `Note`, `Plot` — mismos campos y relaciones que el backend original (ver `backend-old/prisma/schema.prisma`), para mantener compatibilidad con el frontend sin cambios.
