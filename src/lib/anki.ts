export interface AnkiStats {
  easeFactor: number;
  interval: number; // dias
  repetitions: number;
  lapses: number;
  status: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";
  nextReviewDate: Date;
}

export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

/**
 * Algoritmo SuperMemo-2 (SM-2 / Anki) para cálculo de Repetição Espaçada
 */
export function calculateAnkiSM2(
  current: AnkiStats,
  rating: Rating
): AnkiStats {
  let { easeFactor, interval, repetitions, lapses } = current;
  let status: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING" = current.status;

  // Ajusta Ease Factor (Fator de Facilidade, mín 1.3)
  // Fórmula padrão SM-2: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  // Mapeamento Rating 1..4 -> Grade 0..5 (1=0, 2=3, 3=4, 4=5)
  const gradeMap: Record<Rating, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };
  const grade = gradeMap[rating];

  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  if (rating === 1) {
    // AGAIN: Falha / Erro
    repetitions = 0;
    lapses += 1;
    interval = 0; // Revisar no mesmo dia (ex: 10 minutos)
    status = "RELEARNING";
  } else {
    // Resposta bem-sucedida (Hard, Good, Easy)
    if (repetitions === 0) {
      if (rating === 2) interval = 1;      // Hard: 1 dia
      else if (rating === 3) interval = 1; // Good: 1 dia
      else if (rating === 4) interval = 4; // Easy: 4 dias
    } else if (repetitions === 1) {
      if (rating === 2) interval = 2;
      else if (rating === 3) interval = 6;
      else if (rating === 4) interval = 10;
    } else {
      // Repetições > 1
      if (rating === 2) {
        interval = Math.round(interval * 1.2);
      } else if (rating === 3) {
        interval = Math.round(interval * easeFactor);
      } else if (rating === 4) {
        interval = Math.round(interval * easeFactor * 1.3);
      }
    }

    repetitions += 1;
    status = "REVIEW";
  }

  const nextReviewDate = new Date();
  if (interval === 0) {
    // 10 minutos para AGAIN
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 10);
  } else {
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  }

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    repetitions,
    lapses,
    status,
    nextReviewDate,
  };
}
