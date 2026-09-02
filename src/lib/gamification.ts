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
  { minLevel: 1, title: "Iniciante Curioso", badge: "🌱" },
  { minLevel: 3, title: "Aprendiz Focado", badge: "⚡" },
  { minLevel: 5, title: "Estudante Consistente", badge: "🧠" },
  { minLevel: 8, title: "Mestre da Memória", badge: "🔥" },
  { minLevel: 12, title: "Especialista em Retenção", badge: "💎" },
  { minLevel: 16, title: "Sábio da Repetição", badge: "👑" },
  { minLevel: 20, title: "Lenda Suprema do Anki", badge: "🚀" },
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
