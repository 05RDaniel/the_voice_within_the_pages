# Despliegue del Backend en Render

Esta guía explica cómo desplegar el backend de "La Voz de las Páginas" en Render.

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
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (para desarrollo) |

### Variables de Entorno

Haz clic en **Advanced** → **Add Environment Variable** y añade las siguientes:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | La Internal Database URL copiada en el Paso 1 |
| `JWT_SECRET` | Una cadena aleatoria segura (mínimo 32 caracteres) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

> **Nota**: Para generar un JWT_SECRET seguro, puedes usar:
> ```bash
> openssl rand -base64 32
> ```

4. Haz clic en **Create Web Service**

## Paso 3: Ejecutar las Migraciones

Una vez desplegado el servicio, necesitas ejecutar las migraciones de Prisma:

### Opción A: Usar la Shell de Render

1. En el Dashboard, ve a tu Web Service
2. Haz clic en la pestaña **Shell**
3. Ejecuta:
   ```bash
   npx prisma db push
   ```

### Opción B: Añadir al Build Command

Modifica el Build Command para incluir las migraciones:

```
npm install && npx prisma generate && npx prisma db push && npm run build
```

> **Importante**: Esta opción ejecutará las migraciones en cada despliegue. Úsala solo si estás seguro de que los cambios de esquema son compatibles.

## Paso 4: Poblar la Base de Datos (Opcional)

Si quieres añadir las citas iniciales:

1. Accede a la Shell del servicio
2. Ejecuta:
   ```bash
   npx ts-node scripts/seedQuotes.ts
   ```

## Paso 5: Verificar el Despliegue

1. Una vez completado el despliegue, Render te proporcionará una URL como:
   ```
   https://la-voz-de-las-paginas-api.onrender.com
   ```

2. Verifica que el backend funciona accediendo a:
   ```
   https://tu-url.onrender.com/api/quotes/random?lang=es
   ```

3. Deberías recibir una respuesta JSON con una cita aleatoria.

## Paso 6: Configurar el Frontend

Actualiza la URL de la API en el frontend (`frontend/src/lib/api.js`):

```javascript
const API_URL = 'https://tu-url.onrender.com';
```

O mejor, usa una variable de entorno:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Y configura `VITE_API_URL` en tu entorno de producción del frontend.

## Configuración de CORS

Asegúrate de que el backend acepta peticiones desde el dominio de tu frontend. En `backend/src/index.ts`, actualiza la configuración de CORS:

```typescript
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://tu-frontend-url.com" // Añade tu URL de producción
  ],
  credentials: true
}));
```

## Estructura de Archivos para Render

Render detectará automáticamente la configuración, pero puedes crear un archivo `render.yaml` en la raíz del proyecto para configuración como código:

```yaml
services:
  - type: web
    name: la-voz-de-las-paginas-api
    runtime: node
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: la-voz-de-las-paginas-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
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
3. Asegúrate de que el `package.json` tiene los scripts correctos:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "ts-node-dev src/index.ts"
     }
   }
   ```

### Error de conexión a la base de datos

1. Verifica que `DATABASE_URL` use la **Internal Database URL** (no la External)
2. Comprueba que la base de datos esté en la misma región que el servicio
3. Asegúrate de que la base de datos esté activa (no suspendida por inactividad)

### Las migraciones fallan

1. Verifica la sintaxis del esquema de Prisma
2. Revisa los logs para ver el error específico
3. Si hay conflictos, considera usar `prisma db push --force-reset` (⚠️ esto borra todos los datos)

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
- [Guía de Node.js en Render](https://render.com/docs/deploy-node-express-app)
- [Documentación de Prisma](https://www.prisma.io/docs)
