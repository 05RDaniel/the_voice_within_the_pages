# Despliegue del Frontend en Vercel

Esta guía explica cómo desplegar el frontend de "La Voz de las Páginas" en Vercel.

## Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Repositorio del proyecto en GitHub
- Backend desplegado (ej: en Render)

## Paso 1: Conectar con Vercel

### Opción A: Desde el Dashboard de Vercel

1. Inicia sesión en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **"Add New..."** → **"Project"**
3. Importa tu repositorio de GitHub:
   - Si es la primera vez, autoriza a Vercel a acceder a tu cuenta de GitHub
   - Selecciona el repositorio `the_voice_within_the_pages`

### Opción B: Usando Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# En la carpeta del proyecto
cd la-voz-de-las-paginas/frontend
vercel
```

## Paso 2: Configurar el Proyecto

### Configuración del Build

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Variables de Entorno

Haz clic en **"Environment Variables"** y añade:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://la-voz-de-las-paginas-api.onrender.com` |

> **Importante**: Las variables de Vite deben comenzar con `VITE_` para estar disponibles en el cliente.

## Paso 3: Desplegar

1. Revisa la configuración
2. Haz clic en **"Deploy"**
3. Espera a que termine el build (generalmente 1-2 minutos)

## Paso 4: Configurar el Dominio (Opcional)

### Usar un Dominio Personalizado

1. Ve a **Settings** → **Domains**
2. Añade tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Vercel

### URL por Defecto

Vercel te proporcionará URLs automáticas:
- Producción: `https://tu-proyecto.vercel.app`
- Preview: `https://tu-proyecto-git-branch.vercel.app`

## Paso 5: Actualizar CORS en el Backend

Una vez desplegado, añade la URL del frontend a la configuración CORS del backend.

En Render, añade la variable de entorno:
- `FRONTEND_URL` = `https://tu-proyecto.vercel.app`

O actualiza directamente `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://tu-proyecto.vercel.app", // Añade tu URL de Vercel
    process.env.FRONTEND_URL || ""
  ].filter(Boolean),
  credentials: true,
}));
```

## Configuración Adicional

### Archivo vercel.json (Opcional)

Crea `frontend/vercel.json` para configuración avanzada:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> **Nota**: El `rewrites` es necesario para que las rutas de React Router funcionen correctamente (evita errores 404 al recargar páginas).

### Configuración para SPA (Single Page Application)

Si encuentras errores 404 al recargar páginas, asegúrate de tener el archivo `vercel.json` con la configuración de `rewrites` mostrada arriba.

## Despliegues Automáticos

Por defecto, Vercel desplegará automáticamente:
- **Producción**: Cada push a la rama `main`
- **Preview**: Cada push a otras ramas o Pull Requests

### Desactivar Auto-Deploy

Si prefieres desplegar manualmente:
1. Ve a **Settings** → **Git**
2. Desactiva **"Auto-Deploy"**

## Variables de Entorno por Ambiente

Puedes configurar diferentes valores según el ambiente:

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `VITE_API_URL` | URL de producción | URL de staging | `http://localhost:5000` |

Para configurar:
1. Ve a **Settings** → **Environment Variables**
2. Al añadir una variable, selecciona los ambientes donde aplica

## Solución de Problemas

### Error: "404 Not Found" al recargar páginas

Añade `vercel.json` con la configuración de `rewrites` (ver sección anterior).

### Error: "CORS policy" en peticiones al backend

1. Verifica que `VITE_API_URL` esté configurado correctamente
2. Asegúrate de que el backend permita la URL de Vercel en CORS
3. Revisa que el backend tenga `credentials: true` en la configuración de CORS

### Las variables de entorno no funcionan

1. Las variables deben comenzar con `VITE_`
2. Después de cambiar variables, necesitas re-desplegar
3. Verifica en **Deployments** → **[deployment]** → **Source** que la variable esté presente

### El build falla

1. Revisa los logs de build en el dashboard
2. Verifica que `npm run build` funcione localmente
3. Asegúrate de que todas las dependencias estén en `package.json`

### Errores de TypeScript/ESLint

Si el build falla por errores de linting:

```json
// En package.json, modifica el script build
{
  "scripts": {
    "build": "vite build"  // Sin verificación de tipos
  }
}
```

O configura ESLint para ser menos estricto en producción.

## Monitoreo y Analytics

### Vercel Analytics (Opcional)

1. Ve a **Analytics** en el dashboard
2. Habilita **Web Analytics**
3. Instala el paquete:
   ```bash
   npm install @vercel/analytics
   ```
4. Añade en `main.jsx`:
   ```jsx
   import { Analytics } from '@vercel/analytics/react';
   
   // En el render
   <Analytics />
   ```

### Speed Insights (Opcional)

1. Habilita **Speed Insights** en el dashboard
2. Instala:
   ```bash
   npm install @vercel/speed-insights
   ```
3. Añade en `main.jsx`:
   ```jsx
   import { SpeedInsights } from '@vercel/speed-insights/react';
   
   // En el render
   <SpeedInsights />
   ```

## Resumen de URLs

Después del despliegue tendrás:

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | `https://tu-proyecto.vercel.app` |
| Backend (Render) | `https://la-voz-de-las-paginas-api.onrender.com` |

## Enlaces Útiles

- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de Vite en Vercel](https://vercel.com/docs/frameworks/vite)
- [Variables de Entorno en Vercel](https://vercel.com/docs/environment-variables)
- [Dominios Personalizados](https://vercel.com/docs/custom-domains)
