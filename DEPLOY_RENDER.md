# Despliegue del Backend en Render

Esta guía explica cómo desplegar el backend de "La voz de las páginas" en Render.

## Requisitos Previos

- Cuenta en [Render](https://render.com)
- Repositorio del proyecto en GitHub (público o privado)
- El proyecto debe estar subido al repositorio

## Paso 1: Crear la Base de Datos PostgreSQL

1. Inicia sesión en [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **New +** → **PostgreSQL**
3. Configura la base de datos:
   - **Name**: `la-voz-de-las-paginas-db` (o el nombre que prefieras)
   - **Database**: `lavozdlaspaginas` (nombre de la base de datos)
   - **User**: se genera automáticamente
   - **Region**: selecciona la más cercana a tus usuarios
   - **PostgreSQL Version**: 15 o superior
   - **Plan**: Free (para desarrollo) o el plan que necesites
4. Haz clic en **Create Database**
5. Una vez creada, copia la **Internal Database URL** (la usarás más adelante)

## Paso 2: Crear el Web Service

1. En el Dashboard de Render, haz clic en **New +** → **Web Service**
2. Conecta tu repositorio de GitHub:
   - Si es la primera vez, autoriza a Render a acceder a tu cuenta de GitHub
   - Selecciona el repositorio `the_voice_within_the_pages`
3. Configura el servicio:

### Configuración Básica

| Campo | Valor |
|-------|-------|
| **Name** | `la-voz-de-las-paginas-api` |
| **Region** | La misma que la base de datos |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && alembic upgrade head` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free (para desarrollo) |

### Variables de Entorno

Haz clic en **Advanced** → **Add Environment Variable** y añade las siguientes:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | La Internal Database URL copiada en el Paso 1 |
| `SESSION_SECRET` | Una cadena aleatoria segura (mínimo 32 caracteres) |
| `FRONTEND_URL` | URL exacta del frontend (ej. `https://la-voz-de-las-paginas.vercel.app`) para CORS |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

> **Importante**: `FRONTEND_URL` debe ser la URL de tu front en Vercel. Si no la configuras, el login desde el front desplegado puede fallar con "Failed to fetch". En plan Free el servicio puede tardar ~50 s en despertar; si falla, espera y vuelve a intentar.
>
> Para generar un SESSION_SECRET seguro, puedes usar:
> ```bash
> openssl rand -base64 32
> ```

### Correo (verificación de cuenta, etc.)

En Render los puertos SMTP (465/587) suelen estar bloqueados, por lo que **no uses Hostinger SMTP** en producción. Usa **Resend** (API por HTTPS):

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | API key de [Resend](https://resend.com/api-keys) (cuenta gratuita) |
| `EMAIL_FROM` | Email remitente; debe estar verificado en Resend (o `onboarding@resend.dev` solo para pruebas) |

Si defines `RESEND_API_KEY`, el backend enviará los correos por Resend. En local puedes seguir usando SMTP (Hostinger) sin definir `RESEND_API_KEY`.

4. Haz clic en **Create Web Service**

## Paso 3: Ejecutar las Migraciones

Las migraciones de Alembic ya se ejecutan automáticamente como parte del **Build Command** (`alembic upgrade head`) en cada despliegue. Si necesitas ejecutarlas manualmente:

1. En el Dashboard, ve a tu Web Service
2. Haz clic en la pestaña **Shell**
3. Ejecuta:
   ```bash
   alembic upgrade head
   ```

## Paso 4: Poblar la Base de Datos (Opcional)

Si quieres añadir las citas iniciales:

1. Accede a la Shell del servicio
2. Ejecuta:
   ```bash
   python -m scripts.seed_quotes
   ```

## Paso 5: Verificar el Despliegue

1. Una vez completado el despliegue, Render te proporcionará una URL (ej. `https://la-voz-de-las-paginas-api.onrender.com`). Si has configurado el dominio personalizado (Paso 7), usa `https://api.thevoicewithinthepages.es`.

2. Verifica que el backend funciona accediendo a:
   ```
   https://api.thevoicewithinthepages.es/api/quotes/random?lang=es
   ```

3. Deberías recibir una respuesta JSON con una cita aleatoria.

## Paso 6: Configurar el Frontend

La app usa por defecto `https://api.thevoicewithinthepages.es`. Para usar otro dominio, configura `VITE_API_URL` en Vercel (o tu plataforma de frontend).

## Paso 7: Dominio personalizado (api.thevoicewithinthepages.es)

Para que la API use `api.thevoicewithinthepages.es` (recomendado para cookies same-site y login en móviles):

1. En Render → tu Web Service → **Settings** → **Custom Domains**
2. Añade `api.thevoicewithinthepages.es`
3. En tu proveedor DNS, crea un registro CNAME: `api` → `la-voz-de-las-paginas-api.onrender.com` (o el host que Render indique)
4. Espera a que Render verifique el SSL (puede tardar unos minutos)

## Configuración de CORS

Asegúrate de que el backend acepta peticiones desde el dominio de tu frontend. En `backend/app/config.py`, la propiedad `allowed_origins` añade automáticamente `FRONTEND_URL`; si necesitas otros orígenes fijos, edita la lista en ese archivo.

## Estructura de Archivos para Render

Render detectará automáticamente la configuración, pero puedes crear un archivo `render.yaml` en la raíz del proyecto para configuración como código:

```yaml
services:
  - type: web
    name: la-voz-de-las-paginas-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: la-voz-de-las-paginas-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: FRONTEND_URL
        sync: false
      - key: NODE_ENV
        value: production

databases:
  - name: la-voz-de-las-paginas-db
    plan: free
```

## Solución de Problemas

### El servicio no inicia

1. Revisa los logs en la pestaña **Logs** del servicio
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el Build Command instala las dependencias de `requirements.txt` y aplica las migraciones (`pip install -r requirements.txt && alembic upgrade head`), y que el Start Command lanza Uvicorn (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`)

### Error de conexión a la base de datos

1. Verifica que `DATABASE_URL` use la **Internal Database URL** (no la External)
2. Comprueba que la base de datos esté en la misma región que el servicio
3. Asegúrate de que la base de datos esté activa (no suspendida por inactividad)

### Las migraciones fallan

1. Verifica la sintaxis de las migraciones en `backend/alembic/versions/`
2. Revisa los logs para ver el error específico
3. Si hay conflictos irreconciliables en un entorno de desarrollo, puedes recrear la base de datos y volver a ejecutar `alembic upgrade head` (⚠️ esto borra todos los datos)

### El servicio se suspende (plan Free)

En el plan gratuito, los servicios se suspenden tras 15 minutos de inactividad. Para evitarlo:
- Usa un servicio de ping como [UptimeRobot](https://uptimerobot.com) para mantenerlo activo
- O actualiza a un plan de pago

## Notas Adicionales

- **Límites del plan Free**: 750 horas/mes de ejecución, se suspende tras inactividad
- **Base de datos Free**: 1GB de almacenamiento, se elimina tras 90 días de inactividad
- **Logs**: Se mantienen durante 7 días en el plan Free
- **SSL**: Render proporciona SSL automáticamente para todos los servicios

## Enlaces Útiles

- [Documentación de Render](https://render.com/docs)
- [Guía de Python (FastAPI) en Render](https://render.com/docs/deploy-fastapi)
- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentación de Alembic](https://alembic.sqlalchemy.org/)
