from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, sourced from environment variables (.env in development)."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    database_url: str = ""
    port: int = 5000
    frontend_url: str = ""
    session_secret: str = "the-voice-within-the-pages-secret-key"
    node_env: str = "development"

    # Email - Resend (preferred) or SMTP fallback
    resend_api_key: str | None = None
    smtp_host: str = "smtp.hostinger.com"
    smtp_port: int = 465
    smtp_secure: bool = True
    smtp_user: str | None = None
    smtp_pass: str | None = None
    email_from: str | None = None

    @property
    def is_production(self) -> bool:
        return self.node_env == "production"

    @property
    def async_database_url(self) -> str:
        """Prisma-style DATABASE_URL uses the plain postgresql:// scheme; SQLAlchemy's
        async engine needs the asyncpg driver explicitly."""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @property
    def allowed_origins(self) -> list[str]:
        origins = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "https://the-voice-within-the-pages-frontend.vercel.app",
            "https://la-voz-de-las-paginas.vercel.app",
            "https://www.thevoicewithinthepages.es",
            "https://thevoicewithinthepages.es",
        ]
        if self.frontend_url:
            origins.append(self.frontend_url)
        return origins

    @property
    def cookie_domain(self) -> str | None:
        return ".thevoicewithinthepages.es" if self.is_production else None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
