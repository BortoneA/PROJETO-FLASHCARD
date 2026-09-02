import { getDueCardsForDeck } from "@/app/actions/flashcards";
import { db } from "@/lib/db";
import FlashcardDeck from "@/components/FlashcardDeck";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  let deckTitle = "Todos os Baralhos";
  if (deckId !== "all") {
    const deck = await db.deck.findUnique({ where: { id: deckId } });
    if (!deck) {
      notFound();
    }
    deckTitle = deck.title;
  }

  const cards = await getDueCardsForDeck(deckId);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white antialiased">
      <FlashcardDeck deckId={deckId} deckTitle={deckTitle} initialCards={cards} />
    </main>
  );
}
