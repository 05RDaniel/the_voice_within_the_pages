# La Voz de las Páginas

**La Voz de las Páginas** — A narrative project manager for writers: stories, timelines, plots, and content with optional text-to-speech.

## Highlights

- Narrative workspace: create and edit stories, attach timelines and plots (time ranges), and manage content with optional audio.
- Separate React (Vite) frontend and Express (TypeScript) backend; session-based auth and REST API.
- PostgreSQL + Prisma; domain model with User, Story, Timeline, Plot, Content, and Quote.
- Suited for ongoing development (MVP/prototype); deployable to Vercel (frontend) and Render (backend).

---

## Project Overview

**What it is**  
La Voz de las Páginas is a web application for creating and managing narrative projects. Writers can organize stories, define timelines and plots (events with start/end positions), store content (with optional audio), and control story visibility (public, private, unlisted). Users have profiles and session-based access.

**What problem it solves**  
It offers an alternative to plain text editors by providing a structured workflow for the full creative process: from initial idea to a coherent story with timelines and plots, without locking you into a single document.

**Context**  
Personal / ongoing project for learning and practicing full-stack development and narrative-domain modeling. Can serve as a portfolio piece or base for a writing tool.

---

## Project Status

**Current state**  
Ongoing MVP / prototype. Core flows work: auth, stories CRUD, timelines and plots per story, content management, quotes (e.g. for UI), profile and password change.

**Actual scope**  
- User registration, login, logout, profile (including profile image and change password).  
- Stories: create, list, get, update, delete; visibility (PUBLIC, PRIVATE, UNLISTED).  
- Timelines: one default per story; create/list/update/delete.  
- Plots: name, description, start/end (float), color; attached to a timeline.  
- Content: title, text, optional audio URL; per user.  
- Quotes: public, by language; used for UI (e.g. random quote).  
- Frontend: React + Vite, React Router, theme/language contexts; pages for Home, Login, Register, Profile, Stories, Story Editor, Scriptorium (content), Plots, Timeline view.

---

## Key Features

- **User accounts** — Register, login, logout; session-based auth; profile with optional image and change password.
- **Stories** — Full CRUD; rich text content; visibility (public, private, unlisted).
- **Timelines** — One or more per story; default timeline created with each story.
- **Plots** — Events on a timeline with name, description, start/end (float), and optional color.
- **Content** — User-owned entries with title, text, and optional audio URL (e.g. for text-to-speech).
- **Quotes** — Stored by language; public API for UI (e.g. random quote).
- **UI** — Responsive layout; theme and language context; Scriptorium, Plots, and Timeline views.

**Domain entities**  
User, Story, Timeline, Plot, Content, Quote (and enums such as Visibility).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, React Router 7, CSS |
| **Backend** | Node.js, Express 4, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Authentication** | Session-based (express-session), bcrypt for passwords |
| **Tooling** | Zod (validation in backend), ESLint, tsx (dev) |

---

## Architecture Overview

- **Frontend / backend split**: `frontend/` (React SPA) and `backend/` (Express API) are separate apps. Frontend calls backend over HTTP with `credentials: 'include'` for session cookies.
- **Communication**: REST API under `/api/*` (auth, content, quotes, stories, timelines, plots). CORS is configured for the frontend origin(s); session cookie is sameSite in production when needed (e.g. cross-origin Vercel ↔ Render).
- **Responsibilities**:  
  - **Frontend**: UI, routing, theme/language; all data via `lib/api.js` (get/post/put/delete).  
  - **Backend**: Auth (login, register, logout, me, profile, change password), CRUD for stories/timelines/plots/content/quotes; middleware `requireAuth` for protected routes; Prisma for DB access.

---

## Key Technical Decisions

- **React + Vite** — Fast dev experience and simple build; no Next.js so backend stays fully separate.
- **Express + TypeScript** — Clear API surface and type-safe backend; session stored in server memory (or configured store) with cookie id.
- **Session-based auth** — Cookie-backed session (no JWT in the default setup); `requireAuth` checks `req.session.userId`; passwords hashed with bcrypt; validation and normalization (email, username) in auth controller.
- **Domain model** — Story as the central artifact; Timeline belongs to Story; Plot belongs to Timeline (start/end as floats for ordering/positioning). Content and Quote are separate resources (Content per user, Quote global by lang).

---

## What This Project Demonstrates

- Full-stack architecture with a separate SPA and REST API.
- Session-based authentication and protected routes.
- Relational modeling: User → Story → Timeline → Plot; User → Content; Quote as a simple global entity.
- Use of Prisma (migrations, indexes, relations) and Express middleware.
- Frontend state (theme, language) and API client with credentials.
- Structured README and deployment notes (e.g. Vercel + Render).

---

## Project Structure

```
la-voz-de-las-paginas/
├── frontend/                 # React SPA (Vite)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/      # Header, Footer
│   │   ├── contexts/        # Theme, Language
│   │   ├── lib/             # api.js (API client)
│   │   ├── pages/           # Home, Login, Register, Profile, Stories, StoryEditor, Scriptorium, Plots, TimelineView
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── backend/                  # Express API (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma    # User, Content, Quote, Story, Timeline, Plot
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/     # auth, content, plot, quote, story, timeline
│   │   ├── lib/             # prisma.ts
│   │   ├── middleware/     # auth (requireAuth)
│   │   ├── routes/         # auth, content, plot, quote, story, timeline
│   │   ├── utils/           # passwordUtils
│   │   └── index.ts        # Express app, CORS, session, routes
│   └── scripts/             # createUser, seedQuotes
├── package.json             # Root: dev (concurrently frontend + backend), install:all, build
├── DEPLOY_VERCEL.md         # Frontend deploy (Vercel)
├── DEPLOY_RENDER.md         # Backend deploy (Render)
└── QUICK_START.md           # Short setup guide
```

---

## Getting Started / Local Setup

**Prerequisites**

- Node.js 20+
- PostgreSQL (local or hosted, e.g. Neon)
- npm (or yarn)

**Installation (frontend)**

```bash
cd frontend
npm install
```

**Installation (backend)**

```bash
cd backend
npm install
```

**Environment variables**

- **Backend** (`backend/.env`):

  ```env
  DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
  PORT=5000
  FRONTEND_URL=http://localhost:5173
  SESSION_SECRET=your-secret-key
  NODE_ENV=development
  ```

- **Frontend** (optional, `frontend/.env`):

  ```env
  VITE_API_URL=http://localhost:5000
  ```

**Database**

```bash
cd backend
npx prisma generate
npx prisma db push
# or: npx prisma migrate dev
```

**Run locally**

- Backend: `cd backend && npm run dev` (default http://localhost:5000).
- Frontend: `cd frontend && npm run dev` (default http://localhost:5173).

Or from the repo root (if configured):

```bash
npm run dev
```

This runs frontend and backend concurrently.

---

## Database Design

**Main entities**

- **User** — `id`, `username` (unique), `email` (unique), `password` (hashed), `profileImage` (optional), timestamps.
- **Content** — `id`, `title`, `text`, `audioUrl` (optional), `userId`, timestamps.
- **Quote** — `id`, `quote`, `author` (optional), `lang` (default `"es"`), timestamps.
- **Story** — `id`, `title`, `content` (text), `visibility` (PUBLIC | PRIVATE | UNLISTED), `authorId`, timestamps.
- **Timeline** — `id`, `name` (default “Línea temporal principal”), `storyId`, timestamps.
- **Plot** — `id`, `name`, `description` (optional), `start`, `end` (floats), `color` (optional), `timelineId`, timestamps.

**Relations**

- **User → Content**: One-to-many.
- **User → Story**: One-to-many (author).
- **Story → Timeline**: One-to-many; cascade on delete.
- **Timeline → Plot**: One-to-many; cascade on delete.

**Indexes**

- Content: `userId`, `(userId, createdAt)`.
- Quote: `lang`.
- Story: `authorId`, `(authorId, createdAt)`, `visibility`.
- Timeline: `storyId`.
- Plot: `timelineId`.

---

## Authentication Flow

**Type**  
Session-based (express-session). The server stores the session and sends a session cookie; no JWT in the default setup.

**Flow**

1. **Register** — POST with username, email, password; validation and normalization; uniqueness check; bcrypt hash; create User; set `req.session.userId` (and optionally userEmail/username); return user payload.
2. **Login** — POST with usernameOrEmail and password; find user by email or username; verify password with bcrypt; set session; return user payload.
3. **Protected routes** — Middleware `requireAuth` checks `req.session.userId`; if missing, responds 401.
4. **Logout** — Session destroyed; cookie cleared; 200 with message.
5. **Profile** — GET /api/auth/me returns current user; PATCH-style endpoints for profile image and change password (current password required).

Frontend uses `credentials: 'include'` so the session cookie is sent with every API request.

---

## Development & Scripts

**Frontend (from `frontend/`)**

- `npm run dev` — Dev server (Vite).
- `npm run build` — Production build.
- `npm run preview` — Preview production build.
- `npm run lint` — ESLint.

**Backend (from `backend/`)**

- `npm run dev` — Dev server with tsx watch.
- `npm run build` — Compile TypeScript to `dist/`.
- `npm start` — Run `dist/index.js`.
- `npx prisma generate` — Generate Prisma Client.
- `npx prisma db push` — Sync schema to DB (no migration files).
- `npx prisma migrate dev` — Create/apply migrations.
- `npx prisma studio` — Open Prisma Studio.

**Root**

- `npm run dev` — Run frontend and backend together (concurrently).
- `npm run install:all` — Install root, frontend, and backend deps.
- `npm run build` — Build frontend and backend.

---

## Future Improvements / Roadmap

- **Features**: Text-to-speech integration for content; export story/timeline (e.g. PDF or Markdown); collaboration or sharing of stories; versioning or drafts for stories.
- **Technical**: Optional session store (e.g. Redis) for production scaling; rate limiting on auth; optional OAuth; stricter validation (e.g. Zod) on all API bodies; E2E tests.

---

## License

All rights reserved.
