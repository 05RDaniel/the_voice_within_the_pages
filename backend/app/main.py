from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.errors import register_exception_handlers
from app.routers import auth, characters, content, notes, plots, quotes, stories, timelines

app = FastAPI(title="The voice within the pages API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.get("/health")
async def health():
    return {"status": "ok", "message": "The voice within the pages API is running"}


app.include_router(auth.router)
app.include_router(content.router)
app.include_router(quotes.router)
app.include_router(stories.router)
app.include_router(timelines.router)
app.include_router(plots.router)
app.include_router(notes.router)
app.include_router(characters.router)
