import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const decks = await prisma.deck.findMany({ include: { cards: true } });
  console.log("Decks count:", decks.length);
  for (const d of decks) {
    console.log(`- ${d.title}: ${d.cards.length} cards`);
  }
  await prisma.$disconnect();
}

run().catch(console.error);
