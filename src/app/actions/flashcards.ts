"use server";

import { db } from "@/lib/db";
import { calculateAnkiSM2, Rating } from "@/lib/anki";
import { revalidatePath } from "next/cache";

export async function getDecks() {
  const decks = await db.deck.findMany({
    include: {
      cards: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return decks.map((deck) => {
    const dueCards = deck.cards.filter(
      (c) => new Date(c.nextReviewDate) <= now
    );
    const newCards = deck.cards.filter((c) => c.repetitions === 0);

    return {
      ...deck,
      totalCards: deck.cards.length,
      dueCardsCount: dueCards.length,
      newCardsCount: newCards.length,
    };
  });
}

export async function createDeck(title: string, description?: string, icon?: string, color?: string) {
  const deck = await db.deck.create({
    data: {
      title,
      description,
      icon: icon || "⚡",
      color: color || "#0071e3",
    },
  });
  revalidatePath("/");
  return deck;
}

export async function deleteDeck(id: string) {
  await db.deck.delete({ where: { id } });
  revalidatePath("/");
}

export async function getDueCardsForDeck(deckId: string) {
  const now = new Date();
  const cards = await db.card.findMany({
    where: {
      deckId,
      nextReviewDate: {
        lte: now,
      },
    },
    orderBy: {
      nextReviewDate: "asc",
    },
  });

  if (cards.length === 0) {
    // Se não tiver nenhum atrasado/devido, traz também os cards NOVOS
    return await db.card.findMany({
      where: { deckId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  }

  return cards;
}

export async function createCard(deckId: string, front: string, back: string, extra?: string) {
  const card = await db.card.create({
    data: {
      deckId,
      front,
      back,
      extra,
    },
  });
  revalidatePath(`/study/${deckId}`);
  return card;
}

export async function submitCardReview(cardId: string, rating: Rating, timeMs: number = 0) {
  const card = await db.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card não encontrado");

  const newStats = calculateAnkiSM2(
    {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      lapses: card.lapses,
      status: card.status as any,
      nextReviewDate: card.nextReviewDate,
    },
    rating
  );

  const [updatedCard] = await db.$transaction([
    db.card.update({
      where: { id: cardId },
      data: {
        easeFactor: newStats.easeFactor,
        interval: newStats.interval,
        repetitions: newStats.repetitions,
        lapses: newStats.lapses,
        status: newStats.status,
        nextReviewDate: newStats.nextReviewDate,
        lastReviewedAt: new Date(),
      },
    }),
    db.reviewLog.create({
      data: {
        cardId,
        rating,
        timeMs,
      },
    }),
  ]);

  revalidatePath(`/study/${card.deckId}`);
  return updatedCard;
}

export async function seedDemoDeckIfEmpty() {
  const count = await db.deck.count();
  if (count > 0) return;

  const deck = await db.deck.create({
    data: {
      title: "Inglês Avançado & Vocabulário Apple",
      description: "Aprenda termos em inglês e conceitos de design com o algoritmo Anki SM-2 em tempo real.",
      icon: "🍎",
      color: "#0071e3",
      cards: {
        create: [
          {
            front: "Serendipity",
            back: "Acontecimentos felizes por mero acaso; sorte inesperada.",
            extra: "Exemplo: Meeting you was pure serendipity.",
          },
          {
            front: "Glassmorphism",
            back: "Estilo de UI com efeito de vidro fosco, focado em profundidade, transparência e desfoque.",
            extra: "Largamente utilizado no macOS, iOS e visionOS.",
          },
          {
            front: "What is Spaced Repetition?",
            back: "Técnica de aprendizado que revisa a informação em intervalos crescentes para maximizar a retenção na memória de longo prazo.",
            extra: "Base do algoritmo do Anki.",
          },
          {
            front: "Ephemeral",
            back: "Que dura muito pouco tempo; efêmero, passageiro.",
            extra: "Exemplo: The ephemeral beauty of cherry blossoms.",
          },
        ],
      },
    },
  });

  return deck;
}
