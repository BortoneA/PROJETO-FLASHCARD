import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { extractDeckTags } from "@/lib/exportRetentionCSV";

export const dynamic = "force-dynamic";

/**
 * Anki Tab-Separated Values (TSV / TXT) Exporter
 * Exports decks in Anki standard text format:
 * #separator:tab
 * #html:true
 * #tags column:4
 * Front \t Back \t Extra \t Tags
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId");

    const exportAll = !deckId || deckId === "all";

    let decksToExport: any[] = [];
    if (exportAll) {
      decksToExport = await db.deck.findMany({
        include: { cards: true },
        orderBy: { createdAt: "asc" },
      });
    } else {
      const single = await db.deck.findUnique({
        where: { id: deckId },
        include: { cards: true },
      });
      if (!single) {
        return NextResponse.json({ error: "Baralho não encontrado" }, { status: 404 });
      }
      decksToExport = [single];
    }

    const lines: string[] = [
      "#separator:tab",
      "#html:true",
      "#tags column:4",
    ];

    decksToExport.forEach((deck) => {
      const deckTags = extractDeckTags(deck);

      deck.cards.forEach((card: any) => {
        // Formata os campos substituindo tabulações reais e quebras de linha cruas por <br>
        const cleanFront = (card.front || "").replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
        let cleanBack = (card.back || "").replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
        const cleanExtra = (card.extra || "").replace(/\t/g, " ").replace(/\r?\n/g, "<br>");

        if (card.imageUrl) {
          cleanBack += `<br><img src="${card.imageUrl}">`;
        }

        const cardTags = Array.from(
          new Set([...deckTags, ...extractDeckTags({ title: card.front, description: card.extra })])
        ).map((t: string) => t.replace(/^#/, "").trim()).filter(Boolean);

        const tagsStr = cardTags.join(" ");

        lines.push(`${cleanFront}\t${cleanBack}\t${cleanExtra}\t${tagsStr}`);
      });
    });

    const fileContent = lines.join("\n");
    const fileName = exportAll
      ? "Colecao_Kortex_Anki.txt"
      : `${decksToExport[0].title.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, "_")}_Anki.txt`;

    return new Response(fileContent, {
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro na exportação TSV" }, { status: 500 });
  }
}
