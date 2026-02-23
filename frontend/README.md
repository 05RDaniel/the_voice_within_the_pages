# La voz de las páginas - Frontend

Aplicación React con Vite para el gestor narrativo La voz de las páginas.

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Crea un archivo `.env`:
```
VITE_API_URL=http://localhost:5000
```

3. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura

```
frontend/
├── src/
│   ├── components/    # Componentes React
│   ├── lib/          # Utilidades (API client, helpers)
│   ├── App.jsx       # Componente principal
│   └── main.jsx      # Punto de entrada
├── public/           # Archivos estáticos
└── ...
```

## 🎨 Tecnologías

- **React**: Biblioteca UI
- **Vite**: Build tool y dev server
- **JavaScript/TypeScript**: Lenguaje

## 📝 Scripts

- `npm run dev` - Desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview de producción

## 🔗 Conexión con Backend

El frontend está configurado para conectarse al backend mediante:
- Proxy en `vite.config.js` para desarrollo
- Cliente API en `src/lib/api.js`
