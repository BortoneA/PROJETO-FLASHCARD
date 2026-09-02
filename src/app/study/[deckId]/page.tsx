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
  const deck = await db.deck.findUnique({ where: { id: deckId } });

  if (!deck) {
    notFound();
  }

  const cards = await getDueCardsForDeck(deckId);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white antialiased">
      <FlashcardDeck deckId={deck.id} deckTitle={deck.title} initialCards={cards} />
    </main>
  );
}
