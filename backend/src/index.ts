import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import authRoutes from "./routes/authRoutes";
import contentRoutes from "./routes/contentRoutes";
import quoteRoutes from "./routes/quoteRoutes";
import storyRoutes from "./routes/storyRoutes";
import timelineRoutes from "./routes/timelineRoutes";
import plotRoutes from "./routes/plotRoutes";
import noteRoutes from "./routes/noteRoutes";
import characterRoutes from "./routes/characterRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware – allow frontend origins (set FRONTEND_URL on Render if using another domain)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://the-voice-within-the-pages-frontend.vercel.app",
  "https://la-voz-de-las-paginas.vercel.app",
  "https://www.thevoicewithinthepages.es",
  "https://thevoicewithinthepages.es",
  process.env.FRONTEND_URL || ""
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => o === origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Trust proxy for Render
app.set('trust proxy', 1);

// Session configuration – use PostgreSQL store in production, MemoryStore in dev (when no DB)
const isProduction = process.env.NODE_ENV === "production";
const PgSession = connectPgSimple(session);
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "the-voice-within-the-pages-secret-key",
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: isProduction ? "none" : "lax",
    ...(isProduction && { domain: ".thevoicewithinthepages.es" }),
  },
};
let sessionPool: Pool | null = null;
if (process.env.DATABASE_URL) {
  sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });
  sessionConfig.store = new PgSession({
    pool: sessionPool,
    tableName: "session",
  });
}
app.use(session(sessionConfig));

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "The voice within the pages API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/timelines", timelineRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/characters", characterRoutes);

// Error handling
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  const error = err instanceof Error ? err : new Error("Unknown error");
  res.status(500).json({ error: "Something went wrong!", message: error.message });
});

async function ensureSessionTable(): Promise<void> {
  if (!sessionPool) return;
  await sessionPool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
}

ensureSessionTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to ensure session table:", err);
    process.exit(1);
  });
