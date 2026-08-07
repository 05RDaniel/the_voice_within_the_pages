# La voz de las páginas / The voice within the pages

**La voz de las páginas** (es) / **The voice within the pages** (en) — A narrative project manager for writers: stories, timelines, plots, and content.

## Highlights

- Narrative workspace: create and edit stories (plain-text editor with chapter separators), attach timelines and plots, manage characters per story.
- Separate React (Vite) frontend and FastAPI (Python) backend; session-based auth and REST API.
- PostgreSQL + SQLAlchemy; domain model with User, Story, Timeline, Plot, Character, Note, and Quote.
- Email verification on signup (6-digit code). Deployable to Vercel (frontend) and Render (backend).

---

## Project Overview

**What it is**  
The voice within the pages is a web application for creating and managing narrative projects. Writers can organize stories (with chapter separators in plain text), define timelines and plots (events with start/end), manage characters per story, and control visibility (public, private, unlisted). Users have profiles, email verification on signup, and session-based access.

**What problem it solves**  
It offers an alternative to plain text editors by providing a structured workflow for the full creative process: from initial idea to a coherent story with timelines and plots, without locking you into a single document.

**Context**  
Personal / ongoing project for learning and practicing full-stack development and narrative-domain modeling. Can serve as a portfolio piece or base for a writing tool.

---

## Project Status

**Current state**  
Ongoing MVP / prototype. Core flows work: auth with email verification, stories CRUD, timelines and plots per story, characters per story, plain-text story editor with chapter separators, profile and password change.

**Actual scope**  
- User registration (with email verification by 6-digit code), login, logout, profile (profile image and change password).  
- Stories: create, list, get, update, delete; single plain-text `content` field; visibility (PUBLIC, PRIVATE, UNLISTED). Chapter separators use the tag `<separator>Title</separator>`; parser and “Add separator” button in editor.  
- Story overview: side panels for timelines (left) and characters (right), central area for future content.  
- Characters: name, description; CRUD per story from story overview.  
- Timelines: one default per story; create/list/update/delete.  
- Plots and notes: on a timeline (plots = ranges by chapter; notes = single-point markers).  
- Quotes: by language; used in footer (random quote).  
- Frontend: React + Vite, React Router, theme/language contexts; Home, Login, Register, Verify email, Profile, Scriptorium, Stories, Story overview, Story editor, Plots, Timeline view.

---

## Key Features

- **User accounts** — Register, login, logout; session-based auth; profile with optional image and change password.
- **Stories** — Full CRUD; rich text content; visibility (public, private, unlisted).
- **Timelines** — One or more per story; default timeline created with each story.
- **Plots** — Events on a timeline with name, description, start/end (float), and optional color.
- **Content** — User-owned entries with title and text.
- **Quotes** — Stored by language; public API for UI (e.g. random quote).
- **UI** — Responsive layout; theme and language context; Scriptorium, Plots, and Timeline views.

**Domain entities**  
User, Story, Timeline, Plot, Content, Quote (and enums such as Visibility).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, React Router 7, CSS |
| **Backend** | Python, FastAPI, SQLAlchemy (async) |
| **Database** | PostgreSQL, SQLAlchemy ORM + Alembic migrations |
| **Authentication** | Session-based (cookie backed by a `sessions` table), bcrypt for passwords |
| **Tooling** | Pydantic (validation in backend), ESLint (frontend), Uvicorn (dev server) |

---

## Architecture Overview

- **Frontend / backend split**: `frontend/` (React SPA) and `backend/` (FastAPI API) are separate apps. Frontend calls backend over HTTP with `credentials: 'include'` for session cookies.
- **Communication**: REST API under `/api/*` (auth, stories, characters, timelines, plots, notes, quotes). CORS configured for frontend origin(s); session cookie used in production (e.g. Vercel ↔ Render).
- **Responsibilities**:  
  - **Frontend**: UI, routing, theme/language; data via `lib/api.js` (get/post/put/delete).  
  - **Backend**: Auth (register with email verification, login, logout, me, profile, change password), CRUD for stories/characters/timelines/plots/notes; FastAPI dependency `require_user_id`; SQLAlchemy for DB.

---

## Key Technical Decisions

- **React + Vite** — Fast dev experience and simple build; no Next.js so backend stays fully separate.
- **FastAPI + SQLAlchemy (async)** — Clear API surface and type-safe backend (Pydantic schemas); session stored in a Postgres `sessions` table, referenced by an opaque cookie id.
- **Session-based auth** — Cookie-backed session (no JWT); the `require_user_id` dependency checks the `session_id` cookie against the `sessions` table; passwords hashed with bcrypt; validation and normalization (email, username) in the auth router.
- **Domain model** — Story as the central artifact (plain-text content with `<separator>` tags for chapters); Timeline belongs to Story; Plot and Note belong to Timeline; Character belongs to Story. Quote is global by language.

---

## What This Project Demonstrates

- Full-stack architecture with a separate SPA and REST API.
- Session-based authentication and protected routes.
- Relational modeling: User → Story → Timeline → Plot; User → Content; Quote as a simple global entity.
- Use of SQLAlchemy + Alembic (migrations, indexes, relations) and FastAPI dependencies.
- Frontend state (theme, language) and API client with credentials.
- Structured README and deployment notes (e.g. Vercel + Render).

---

## Project Structure

```
the-voice-within-the-pages/
├── frontend/                 # React SPA (Vite)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/      # Header, Footer
│   │   ├── contexts/        # Theme, Language
│   │   ├── lib/             # api.js (API client)
│   │   ├── pages/           # Home, Login, Register, VerifyEmail, Profile, Stories, StoryOverview, StoryEditor, Scriptorium, Plots, TimelineView
│   │   ├── utils/           # chapterParser
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── backend/                  # FastAPI API (Python)
│   ├── alembic/
│   │   └── versions/        # Migrations (User, Content, Quote, Story, Timeline, Plot, ...)
│   ├── app/
│   │   ├── routers/         # auth, stories, characters, timelines, plots, notes, quotes, content
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic request bodies
│   │   ├── core/            # security (bcrypt), session (cookie + DB), errors
│   │   ├── email.py         # Resend / SMTP
│   │   └── main.py          # FastAPI app, CORS, routes
│   └── scripts/             # create_user.py, seed_quotes.py
├── backend-old/              # Previous Express/Prisma backend (kept for reference)
├── package.json             # Root: dev (concurrently frontend + backend), install:all, build
├── DEPLOY_VERCEL.md         # Frontend deploy (Vercel)
├── DEPLOY_RENDER.md         # Backend deploy (Render)
└── QUICK_START.md           # Short setup guide
```

---

## Getting Started / Local Setup

**Prerequisites**

- Node.js 20+ (frontend)
- Python 3.11+ (backend)
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
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
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
alembic upgrade head
```

**Run locally**

- Backend: `cd backend && uvicorn app.main:app --reload --port 5000` (default http://localhost:5000).
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
- **Content** — `id`, `title`, `text`, `userId`, timestamps.
- **Quote** — `id`, `quote`, `author` (optional), `lang` (default `"es"`), timestamps.
- **Story** — `id`, `title`, `content` (plain text; chapters via `<separator>Title</separator>`), `visibility`, `authorId`, timestamps.
- **Timeline** — `id`, `name`, `storyId`, timestamps.
- **Plot** — `id`, `name`, `description`, `start`, `end` (chapter positions), `color`, `timelineId`, timestamps.
- **Note** — `id`, `name`, `chapterPosition`, `timelineId`, timestamps.
- **Character** — `id`, `name`, `description`, `storyId`, timestamps.

**Relations**

- **User → Story**: One-to-many (author).
- **Story → Timeline**, **Story → Character**: One-to-many; cascade on delete.
- **Timeline → Plot**, **Timeline → Note**: One-to-many; cascade on delete.

**Indexes**

- Quote: `lang`.
- Story: `authorId`, `(authorId, createdAt)`, `visibility`.
- Timeline: `storyId`.
- Plot: `timelineId`.
- Note: `timelineId`.
- Character: `storyId`.

---

## Authentication Flow

**Type**  
Session-based (cookie + Postgres `sessions` table). The server stores the session server-side and sends an opaque session cookie; no JWT in the default setup.

**Flow**

1. **Register** — POST with username, email, password; validation and uniqueness; bcrypt hash; create User (unverified); send 6-digit verification code by email; user must enter code to verify before logging in.
2. **Verify** — POST with email and code; mark user verified; redirect to login with success message.
3. **Login** — POST with usernameOrEmail and password; find user; reject if not verified; verify password with bcrypt; set session; return user payload.
3. **Protected routes** — The `require_user_id` FastAPI dependency checks the `session_id` cookie against the `sessions` table; if missing/expired, responds 401.
4. **Logout** — Session row deleted; cookie cleared; 200 with message.
5. **Profile** — GET /api/auth/me returns current user; PUT-style endpoints for profile image and change password (current password required).

Frontend uses `credentials: 'include'` so the session cookie is sent with every API request.

---

## Development & Scripts

**Frontend (from `frontend/`)**

- `npm run dev` — Dev server (Vite).
- `npm run build` — Production build.
- `npm run preview` — Preview production build.
- `npm run lint` — ESLint.

**Backend (from `backend/`, with the venv active)**

- `uvicorn app.main:app --reload --port 5000` — Dev server with hot reload.
- `alembic upgrade head` — Apply pending migrations.
- `alembic revision --autogenerate -m "..."` — Create a new migration from model changes.
- `python -m scripts.seed_quotes` — Seed the initial quotes.
- `python -m scripts.create_user` — Create a bootstrap user.

**Root**

- `npm run dev` — Run frontend and backend together (concurrently).
- `npm run install:all` — Install root/frontend npm deps and create the backend venv.
- `npm run build` — Build the frontend.

---

## Future Improvements / Roadmap

- **Features**: Export story (e.g. PDF or Markdown); styled preview of story with separator styling; collaboration or sharing; versioning or drafts.
- **Technical**: Optional session store (e.g. Redis) for production; rate limiting on auth; optional OAuth; E2E tests.

---

## License

All rights reserved.