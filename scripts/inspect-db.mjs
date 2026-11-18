import { db } from "./src/lib/db.ts";

async function main() {
  const decks = await db.deck.findMany({ include: { cards: true } });
  console.log("DB Decks Count:", decks.length);
  for (const d of decks) {
    console.log(`- ID: ${d.id} | Title: "${d.title}" | Cards: ${d.cards.length}`);
  }
}

main().catch(console.error);
