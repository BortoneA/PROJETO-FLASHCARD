export interface LevelInfo {
  level: number;
  title: string;
  badge: string;
  nextLevelXp: number;
  currentLevelMinXp: number;
}

/**
 * Títulos de Ranks estilo RPG / Apple Health
 */
const RANKS = [
  { minLevel: 1, title: "Iniciante Curioso", badge: "\uD83C\uDF31" },
  { minLevel: 3, title: "Aprendiz Focado", badge: "\u26A1" },
  { minLevel: 5, title: "Estudante Consistente", badge: "\uD83E\uDDE0" },
  { minLevel: 8, title: "Mestre da Mem\u00f3ria", badge: "\uD83D\uDD25" },
  { minLevel: 12, title: "Especialista em Reten\u00e7\u00e3o", badge: "\uD83D\uDC8E" },
  { minLevel: 16, title: "S\u00e1bio da Repeti\u00e7\u00e3o", badge: "\uD83D\uDC51" },
  { minLevel: 20, title: "Lenda Suprema do Anki", badge: "\uD83D\uDE80" },
];

export function getLevelDetails(xp: number): LevelInfo {
  let level = 1;
  let currentMinXp = 0;
  let nextLevelXp = 100;

  // Curva progressiva de XP (Nível N precisa de mais XP que N-1)
  while (xp >= nextLevelXp) {
    level++;
    currentMinXp = nextLevelXp;
    nextLevelXp = currentMinXp + level * 100;
  }

  // Encontra o título correspondente ao nível atual
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) {
      currentRank = rank;
    }
  }

  return {
    level,
    title: currentRank.title,
    badge: currentRank.badge,
    nextLevelXp,
    currentLevelMinXp: currentMinXp,
  };
}
