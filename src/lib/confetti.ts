import confetti from "canvas-confetti";

export function triggerConfetti(options?: { count?: number; spread?: number; origin?: { y: number } }) {
  if (typeof window === "undefined") return;

  const count = options?.count || 65;
  const spread = options?.spread || 70;
  const originY = options?.origin?.y ?? 0.6;

  // Cores icônicas da paleta Duolingo
  const colors = ["#58cc02", "#1cb0f6", "#ff9600", "#ff4b4b", "#ffd700", "#ce82ff"];

  // Disparo duplo simétrico
  confetti({
    particleCount: Math.round(count / 2),
    angle: 60,
    spread,
    origin: { x: 0.1, y: originY },
    colors,
  });

  confetti({
    particleCount: Math.round(count / 2),
    angle: 120,
    spread,
    origin: { x: 0.9, y: originY },
    colors,
  });
}

export function triggerStarBurst() {
  if (typeof window === "undefined") return;

  const colors = ["#ffd700", "#ff9600", "#58cc02"];
  confetti({
    particleCount: 50,
    spread: 360,
    startVelocity: 30,
    origin: { x: 0.5, y: 0.5 },
    colors,
    shapes: ["star"],
    scalar: 1.2,
  });
}
