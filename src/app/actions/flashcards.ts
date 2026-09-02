"use server";

import { db } from "@/lib/db";
import { calculateAnkiSM2, Rating } from "@/lib/anki";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
  let profile = await db.userProfile.findUnique({
    where: { id: "default_user" },
  });

  if (!profile) {
    profile = await db.userProfile.create({
      data: {
        id: "default_user",
        xp: 0,
        level: 1,
        streak: 1,
      },
    });
  }

  // XP para o pr?ximo n?vel (Ex: N?vel 1 -> 100 XP, N?vel 2 -> 250 XP...)
  const nextLevelXp = profile.level * 100 + (profile.level - 1) * 50;

  return {
    ...profile,
    nextLevelXp,
  };
}

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
      icon: icon || "?",
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

  if (deckId === "all") {
    return await db.card.findMany({
      where: {
        nextReviewDate: {
          lte: now,
        },
      },
      include: {
        deck: true,
      },
      orderBy: {
        nextReviewDate: "asc",
      },
    });
  }

  return await db.card.findMany({
    where: {
      deckId,
      nextReviewDate: {
        lte: now,
      },
    },
    include: {
      deck: true,
    },
    orderBy: {
      nextReviewDate: "asc",
    },
  });
}

export async function createCard(deckId: string, front: string, back: string, extra?: string) {
  const card = await db.card.create({
    data: {
      deckId,
      front,
      back,
      extra,
      nextReviewDate: new Date(),
    },
  });
  revalidatePath(`/study/${deckId}`);
  revalidatePath("/");
  return card;
}

export async function submitCardReview(cardId: string, rating: Rating, timeMs: number = 0) {
  const card = await db.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card n?o encontrado");

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

  // Ganhos de XP por acerto:
  // Easy (4) = 25 XP, Good (3) = 15 XP, Hard (2) = 10 XP, Again (1) = 5 XP (XP de consola??o)
  const xpEarnedMap: Record<Rating, number> = { 4: 25, 3: 15, 2: 10, 1: 5 };
  const xpEarned = xpEarnedMap[rating];

  // Atualiza perfil do usu?rio
  let profile = await db.userProfile.findUnique({ where: { id: "default_user" } });
  if (!profile) {
    profile = await db.userProfile.create({
      data: { id: "default_user", xp: 0, level: 1, streak: 1 },
    });
  }

  const newXp = profile.xp + xpEarned;
  let newLevel = profile.level;
  let nextLevelXp = newLevel * 100 + (newLevel - 1) * 50;

  // Level Up Check
  if (newXp >= nextLevelXp) {
    newLevel += 1;
  }

  // Atualiza Const?ncia (Streak)
  const now = new Date();
  let newStreak = profile.streak;
  if (profile.lastReviewedAt) {
    const lastDate = new Date(profile.lastReviewedAt);
    const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 3600);
    if (diffHours >= 24 && diffHours < 48) {
      newStreak += 1;
    } else if (diffHours >= 48) {
      newStreak = 1; // Perdeu o streak por inatividade
    }
  } else {
    newStreak = 1;
  }

  const [updatedCard, updatedProfile] = await db.$transaction([
    db.card.update({
      where: { id: cardId },
      data: {
        easeFactor: newStats.easeFactor,
        interval: newStats.interval,
        repetitions: newStats.repetitions,
        lapses: newStats.lapses,
        status: newStats.status,
        nextReviewDate: newStats.nextReviewDate,
        lastReviewedAt: now,
      },
    }),
    db.userProfile.update({
      where: { id: "default_user" },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastReviewedAt: now,
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
  revalidatePath(`/study/all`);
  revalidatePath("/");
  return { card: updatedCard, profile: updatedProfile, xpEarned };
}

export async function seedDemoDeckIfEmpty() {
  const count = await db.deck.count();
  if (count > 0) return;

  await db.deck.create({
    data: {
      title: "Ingl?s Avan?ado & Vocabul?rio Apple",
      description: "Aprenda termos em ingl?s e conceitos de design com o algoritmo Anki SM-2 em tempo real.",
      icon: "??",
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
            back: "Estilo de UI com efeito de vidro fosco, focado em profundidade, transpar?ncia e desfoque.",
            extra: "Largamente utilizado no macOS, iOS e visionOS.",
          },
          {
            front: "What is Spaced Repetition?",
            back: "T?cnica de aprendizado que revisa a informa??o em intervalos crescentes para maximizar a reten??o na mem?ria de longo prazo.",
            extra: "Base do algoritmo do Anki.",
          },
          {
            front: "Ephemeral",
            back: "Que dura muito pouco tempo; ef?mero, passageiro.",
            extra: "Exemplo: The ephemeral beauty of cherry blossoms.",
          },
        ],
      },
    },
  });
}
