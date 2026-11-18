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

  let cards = await getDueCardsForDeck(deckId);

  // If no cards are strictly due, provide cards for free review so the user is never blocked from studying
  if (cards.length === 0) {
    if (deckId === "all") {
      cards = await db.card.findMany({
        include: { deck: true },
        take: 30,
        orderBy: { updatedAt: "desc" },
      });
    } else {
      cards = await db.card.findMany({
        where: { deckId },
        include: { deck: true },
        take: 30,
        orderBy: { updatedAt: "desc" },
      });
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground antialiased transition-colors">
      <FlashcardDeck deckId={deckId} deckTitle={deckTitle} initialCards={cards} />
    </main>
  );
}
