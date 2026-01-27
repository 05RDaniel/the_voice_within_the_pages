# La Voz de las Páginas

Aplicación web para convertir texto a voz y gestionar contenido.

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: React
- **Lenguaje**: JavaScript/TypeScript
- **Build Tool**: Vite
- **Estilos**: CSS/Tailwind CSS

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT o Session-based

## 📁 Estructura del Proyecto

```
la-voz-de-las-paginas/
├── frontend/          # Aplicación React
├── backend/           # API Express.js
└── README.md         # Este archivo
```

## 🔧 Instalación

### Prerrequisitos
- Node.js 20+
- PostgreSQL
- npm o yarn

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## 🗄️ Base de Datos

1. Configura la variable `DATABASE_URL` en `backend/.env`
2. Ejecuta las migraciones:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 🚀 Desarrollo

- Frontend: http://localhost:5173 (Vite default)
- Backend API: http://localhost:5000

## 📝 Scripts

### Frontend
- `npm run dev` - Desarrollo
- `npm run build` - Build producción
- `npm run preview` - Preview producción

### Backend
- `npm run dev` - Desarrollo con nodemon
- `npm run build` - Compilar TypeScript
- `npm start` - Producción

## 📄 Licencia

Privado



