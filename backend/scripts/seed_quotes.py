"""Seed the Quote table with the same 20 starter quotes as backend-old/scripts/seedQuotes.ts.

Usage: python -m scripts.seed_quotes (run from the backend/ directory, with the venv active).
"""

import asyncio

from app.database import AsyncSessionLocal
from app.models.quote import Quote

QUOTES = [
    # Spanish quotes
    {"quote": "Toda historia empieza cuando alguien decide no callar lo que imagina.", "author": None, "lang": "es"},
    {"quote": "Las palabras no crean mundos: los revelan.", "author": None, "lang": "es"},
    {"quote": "Escribir es ordenar el caos sin destruirlo.", "author": None, "lang": "es"},
    {"quote": "Un personaje bien escrito recuerda cosas que su autor ha olvidado.", "author": None, "lang": "es"},
    {"quote": "No hay silencio más ruidoso que una página en blanco.", "author": None, "lang": "es"},
    {"quote": "La imaginación no huye de la realidad: la reescribe.", "author": None, "lang": "es"},
    {"quote": "Cada borrador es una conversación entre lo que fue y lo que podría ser.", "author": None, "lang": "es"},
    {"quote": "Los mundos ficticios también necesitan reglas para respirar.", "author": None, "lang": "es"},
    {"quote": "Un relato crece cuando deja de obedecer del todo a su creador.", "author": None, "lang": "es"},
    {"quote": "Escribir no es inventar desde cero, sino escuchar con atención.", "author": None, "lang": "es"},
    # English quotes
    {"quote": "Every story begins the moment imagination refuses to stay silent.", "author": None, "lang": "en"},
    {"quote": "Words do not build worlds; they uncover them.", "author": None, "lang": "en"},
    {"quote": "Writing is the art of giving chaos a direction.", "author": None, "lang": "en"},
    {"quote": "A well-written character knows things the author does not.", "author": None, "lang": "en"},
    {"quote": "There is no louder silence than a blank page.", "author": None, "lang": "en"},
    {"quote": "Imagination does not escape reality; it reshapes it.", "author": None, "lang": "en"},
    {"quote": "Every draft is a dialogue between what exists and what might.", "author": None, "lang": "en"},
    {"quote": "Fictional worlds need rules in order to breathe.", "author": None, "lang": "en"},
    {"quote": "A story grows when it stops fully obeying its creator.", "author": None, "lang": "en"},
    {"quote": "Writing is not invention from nothing, but attentive listening.", "author": None, "lang": "en"},
]


async def main() -> None:
    print("Seeding quotes...")
    async with AsyncSessionLocal() as db:
        for quote in QUOTES:
            db.add(Quote(**quote))
            print(f'Added: "{quote["quote"][:50]}..."')
        await db.commit()
    print(f"\nSuccessfully added {len(QUOTES)} quotes!")


if __name__ == "__main__":
    asyncio.run(main())
