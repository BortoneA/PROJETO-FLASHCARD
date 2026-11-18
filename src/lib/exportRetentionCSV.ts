/**
 * Kortex Executive CSV Report Generator
 * Exports Spaced Repetition (SM-2) retention metrics, card reviews, and deck breakdowns.
 */

export function extractDeckTags(deck: { title: string; description?: string | null }): string[] {
  const tags = new Set<string>();

  const fullText = `${deck.title || ""} ${deck.description || ""}`;
  const hashtagMatches = fullText.match(/#[a-zA-Z0-9_\u00C0-\u017F-]+/g);
  if (hashtagMatches) {
    hashtagMatches.forEach((tag) => tags.add(tag.toLowerCase()));
  }

  if (deck.title && deck.title.includes("::")) {
    const parts = deck.title.split("::");
    if (parts.length > 1) {
      parts.slice(0, -1).forEach((cat) => {
        const clean = cat.trim();
        if (clean) tags.add(clean.startsWith("#") ? clean.toLowerCase() : `#${clean.toLowerCase()}`);
      });
    }
  }

  return Array.from(tags);
}

export function exportRetentionCSV(options: {
  analytics?: { totalReviews: number; ratingsCount: Record<number, number> } | null;
  decks: any[];
  userProfile?: any;
}) {
  const { analytics, decks, userProfile } = options;
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toLocaleTimeString("pt-BR");

  const total = analytics?.totalReviews || 0;
  const again = analytics?.ratingsCount[1] || 0;
  const hard = analytics?.ratingsCount[2] || 0;
  const good = analytics?.ratingsCount[3] || 0;
  const easy = analytics?.ratingsCount[4] || 0;
  const retentionRate = total > 0 ? Math.round(((good + easy) / total) * 100) : 100;
  const errorRate = total > 0 ? Math.round((again / total) * 100) : 0;

  const lines: string[] = [];

  lines.push("KORTEX - RELATORIO EXECUTIVO DE RETENCAO E ALGORITMO SRS");
  lines.push(`Gerado em;${dateStr} as ${timeStr}`);
  lines.push(`Perfil;Nivel ${userProfile?.level || 1} - ${userProfile?.title || "Iniciante"} (XP: ${userProfile?.xp || 0})`);
  lines.push("");

  lines.push("METRICAS GERAIS DE REVISAO ESPACADA (SM-2)");
  lines.push("Metrica;Valor;Descricao");
  lines.push(`Total de Revisoes Executadas;${total};Total de cards avaliados nas sessoes`);
  lines.push(`Taxa de Retencao Geral;${retentionRate}%;Percentual de acertos imediatos (Bom + Facil)`);
  lines.push(`Taxa de Esquecimento;${errorRate}%;Percentual de falhas imediatas (Errei)`);
  lines.push(`Errei (Rating 1);${again};Cards enviados para fila de reaprendizagem`);
  lines.push(`Dificil (Rating 2);${hard};Intervalo moderado com fator de facilidade reduzido`);
  lines.push(`Bom (Rating 3);${good};Intervalo normal calculado pelo SM-2`);
  lines.push(`Facil (Rating 4);${easy};Intervalo ampliado com bonus de retencao`);
  lines.push("");

  lines.push("DESEMPENHO POR BARALHO");
  lines.push("ID;Baralho;Total Flashcards;Pendentes Hoje;Cards Novos;Tags / Categorias;Ultima Atualizacao");

  decks.forEach((deck) => {
    const deckTags = extractDeckTags(deck).join(" ") || "-";
    const titleEscaped = `"${(deck.title || "").replace(/"/g, '""')}"`;
    const updated = deck.updatedAt ? new Date(deck.updatedAt).toLocaleDateString("pt-BR") : "-";
    lines.push(
      `${deck.id};${titleEscaped};${deck.totalCards};${deck.dueCardsCount};${deck.newCardsCount};"${deckTags}";${updated}`
    );
  });

  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `kortex-relatorio-srs-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
