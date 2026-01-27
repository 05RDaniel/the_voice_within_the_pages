import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const quotes = [
  // Spanish quotes
  { quote: "Toda historia empieza cuando alguien decide no callar lo que imagina.", author: null, lang: "es" },
  { quote: "Las palabras no crean mundos: los revelan.", author: null, lang: "es" },
  { quote: "Escribir es ordenar el caos sin destruirlo.", author: null, lang: "es" },
  { quote: "Un personaje bien escrito recuerda cosas que su autor ha olvidado.", author: null, lang: "es" },
  { quote: "No hay silencio más ruidoso que una página en blanco.", author: null, lang: "es" },
  { quote: "La imaginación no huye de la realidad: la reescribe.", author: null, lang: "es" },
  { quote: "Cada borrador es una conversación entre lo que fue y lo que podría ser.", author: null, lang: "es" },
  { quote: "Los mundos ficticios también necesitan reglas para respirar.", author: null, lang: "es" },
  { quote: "Un relato crece cuando deja de obedecer del todo a su creador.", author: null, lang: "es" },
  { quote: "Escribir no es inventar desde cero, sino escuchar con atención.", author: null, lang: "es" },
  
  // English quotes
  { quote: "Every story begins the moment imagination refuses to stay silent.", author: null, lang: "en" },
  { quote: "Words do not build worlds; they uncover them.", author: null, lang: "en" },
  { quote: "Writing is the art of giving chaos a direction.", author: null, lang: "en" },
  { quote: "A well-written character knows things the author does not.", author: null, lang: "en" },
  { quote: "There is no louder silence than a blank page.", author: null, lang: "en" },
  { quote: "Imagination does not escape reality; it reshapes it.", author: null, lang: "en" },
  { quote: "Every draft is a dialogue between what exists and what might.", author: null, lang: "en" },
  { quote: "Fictional worlds need rules in order to breathe.", author: null, lang: "en" },
  { quote: "A story grows when it stops fully obeying its creator.", author: null, lang: "en" },
  { quote: "Writing is not invention from nothing, but attentive listening.", author: null, lang: "en" },
];

async function main() {
  console.log('Seeding quotes...');
  
  for (const quote of quotes) {
    await prisma.quote.create({
      data: quote,
    });
    console.log(`Added: "${quote.quote.substring(0, 50)}..."`);
  }
  
  console.log(`\nSuccessfully added ${quotes.length} quotes!`);
}

main()
  .catch((e) => {
    console.error('Error seeding quotes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

