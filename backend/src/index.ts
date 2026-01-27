import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import authRoutes from "./routes/authRoutes";
import contentRoutes from "./routes/contentRoutes";
import quoteRoutes from "./routes/quoteRoutes";
import storyRoutes from "./routes/storyRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    process.env.FRONTEND_URL || ""
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "la-voz-de-las-paginas-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "La Voz de las Páginas API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/stories", storyRoutes);

// Error handling
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  const error = err instanceof Error ? err : new Error("Unknown error");
  res.status(500).json({ error: "Something went wrong!", message: error.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});



