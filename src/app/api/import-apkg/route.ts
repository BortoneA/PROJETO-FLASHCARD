import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSqlJs } from "@/lib/sqlite";
import JSZip from "jszip";

// ═══════════════════════════════════════════════════════════════════
// APKG IMPORT API — Leitor nativo de pacotes Anki (.apkg)
// Suporte: collection.anki2, collection.anki21, multi-deck,
// limpeza de HTML, cloze deletion, merge aditivo com dedup
// ═══════════════════════════════════════════════════════════════════

/**
 * Converte HTML do Anki para texto limpo / Markdown leve.
 * - <br>, <div> → \n
 * - <b>/<strong> → **...**
 * - <i>/<em> → *...*
 * - <u> → __...__
 * - cloze {{c1::answer::hint}} → [answer]
 * - [sound:file] → (removido)
 * - HTML entities → caracteres
 * - Remove todas as demais tags HTML
 */
function cleanAnkiHtml(html: string): string {
  if (!html) return "";

  let text = html;

  // Converte <br>, <br/>, <br /> para \n
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Converte <div>...</div> para conteúdo + \n
  text = text.replace(/<div[^>]*>(.*?)<\/div>/gi, "$1\n");

  // Converte <li> para Markdown list
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");

  // Preserva negrito: <b> ou <strong>
  text = text.replace(/<(b|strong)>(.*?)<\/\1>/gi, "**$2**");
  text = text.replace(/<(b|strong)\s[^>]*>(.*?)<\/\1>/gi, "**$2**");

  // Preserva itálico: <i> ou <em>
  text = text.replace(/<(i|em)>(.*?)<\/\1>/gi, "*$2*");
  text = text.replace(/<(i|em)\s[^>]*>(.*?)<\/\1>/gi, "*$2*");

  // Preserva sublinhado: <u>
  text = text.replace(/<u>(.*?)<\/u>/gi, "__$1__");
  text = text.replace(/<u\s[^>]*>(.*?)<\/u>/gi, "__$1__");

  // Trata cloze deletions: {{c1::answer::hint}} → [answer]
  text = text.replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, "[$1]");

  // Remove referências de áudio [sound:arquivo]
  text = text.replace(/\[sound:[^\]]+\]/gi, "");

  // Remove tags de imagem, preservando o alt text se houver
  text = text.replace(/<img[^>]+alt="([^"]*)"[^>]*\/?>/gi, "($1)");
  text = text.replace(/<img[^>]*\/?>/gi, "");

  // Remove todas as demais tags HTML
  text = text.replace(/<[^>]+>/g, "");

  // HTML entities
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&#x27;/gi, "'");
  text = text.replace(/&apos;/gi, "'");

  // Numeric HTML entities
  text = text.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  // Limpa espaços excessivos e linhas vazias
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}

/**
 * Converte nome hierárquico do Anki para exibição.
 * Ex: "English::Vocabulary::Advanced" → "English - Vocabulary - Advanced"
 */
function cleanDeckName(name: string): string {
  return name.replace(/::/g, " - ");
}

/**
 * Gera um ícone emoji baseado no nome do deck.
 */
function getDeckIcon(name: string): string {
  const lower = name.toLowerCase();
  if (/\b(ingl[eê]s|english)\b/i.test(lower)) return "\uD83C\uDDEC\uD83C\uDDE7";
  if (/\b(espanhol|spanish|espa[ñn]ol)\b/i.test(lower)) return "\uD83C\uDDEA\uD83C\uDDF8";
  if (/\b(franc[eê]s|french|fran[cç]ais)\b/i.test(lower)) return "\uD83C\uDDEB\uD83C\uDDF7";
  if (/\b(alem[aã]o|german|deutsch)\b/i.test(lower)) return "\uD83C\uDDE9\uD83C\uDDEA";
  if (/\b(portugu[eê]s|portuguese)\b/i.test(lower)) return "\uD83C\uDDE7\uD83C\uDDF7";
  if (/\b(japon[eê]s|japanese|nihongo)\b/i.test(lower)) return "\uD83C\uDDEF\uD83C\uDDF5";
  if (/\b(matem[aá]tica|math)\b/i.test(lower)) return "\uD83D\uDCCA";
  if (/\b(hist[oó]ria|history)\b/i.test(lower)) return "\uD83D\uDCDC";
  if (/\b(ci[eê]ncia|science|biolog|qu[ií]mica|f[ií]sica)\b/i.test(lower)) return "\uD83E\uDDEC";
  if (/\b(medicina|medicine|anatom|saude|sa[uú]de)\b/i.test(lower)) return "\uD83E\uDE7A";
  if (/\b(direito|law|jur[ií]d)\b/i.test(lower)) return "\u2696\uFE0F";
  if (/\b(programa|code|develop|software)\b/i.test(lower)) return "\uD83D\uDCBB";
  if (/\b(geograf|geography)\b/i.test(lower)) return "\uD83C\uDF0D";
  if (/\b(m[uú]sica|music)\b/i.test(lower)) return "\uD83C\uDFB5";
  return "\uD83D\uDCE6"; // 📦 default
}

interface AnkiModel {
  id: number;
  name: string;
  type: number; // 0 = standard, 1 = cloze
  flds: { name: string; ord: number }[];
}

interface AnkiDeck {
  id: number;
  name: string;
}

interface ParsedCard {
  front: string;
  back: string;
  extra: string;
  ankiDeckId: number;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "new";
    const targetDeckId = searchParams.get("deckId");

    // Validação de modo merge
    if (mode === "merge" && !targetDeckId) {
      return NextResponse.json(
        { error: "Par\u00e2metro deckId \u00e9 obrigat\u00f3rio no modo merge" },
        { status: 400 }
      );
    }

    if (mode === "merge") {
      const targetDeck = await db.deck.findUnique({ where: { id: targetDeckId! } });
      if (!targetDeck) {
        return NextResponse.json(
          { error: "Baralho de destino n\u00e3o encontrado" },
          { status: 404 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // ═══════════ DESCOMPACTAR APKG ═══════════
    const arrayBuffer = await file.arrayBuffer();
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(arrayBuffer);
    } catch {
      return NextResponse.json(
        { error: "O arquivo n\u00e3o \u00e9 um ZIP v\u00e1lido. Certifique-se de que \u00e9 um pacote .apkg do Anki." },
        { status: 400 }
      );
    }

    // Tenta collection.anki21 (formato moderno) primeiro, depois collection.anki2
    let collectionFile = zip.file("collection.anki21") || zip.file("collection.anki2");
    if (!collectionFile) {
      // Alguns exportadores usam outros nomes - tenta encontrar qualquer .anki2/.anki21
      const allFiles = Object.keys(zip.files);
      const ankiFile = allFiles.find(
        (f) => f.endsWith(".anki2") || f.endsWith(".anki21")
      );
      if (ankiFile) {
        collectionFile = zip.file(ankiFile);
      }
    }

    if (!collectionFile) {
      return NextResponse.json(
        {
          error:
            "Arquivo n\u00e3o cont\u00e9m um banco de dados Anki v\u00e1lido (collection.anki2 ou collection.anki21 n\u00e3o encontrado).",
        },
        { status: 400 }
      );
    }

    // ═══════════ ABRIR SQLITE ═══════════
    const sqliteBuffer = await collectionFile.async("uint8array");
    const SQL = await getSqlJs();
    let sqliteDb: InstanceType<typeof SQL.Database>;
    try {
      sqliteDb = new SQL.Database(sqliteBuffer);
    } catch {
      return NextResponse.json(
        { error: "Falha ao abrir o banco de dados SQLite do pacote Anki. O arquivo pode estar corrompido." },
        { status: 400 }
      );
    }

    // ═══════════ EXTRAIR MODELOS (NOTE TYPES) ═══════════
    const models: Record<number, AnkiModel> = {};
    try {
      const colStmt = sqliteDb.prepare("SELECT models FROM col LIMIT 1");
      if (colStmt.step()) {
        const modelsJson = colStmt.getAsObject().models as string;
        if (modelsJson) {
          const parsedModels = JSON.parse(modelsJson);
          for (const key in parsedModels) {
            const m = parsedModels[key];
            models[m.id] = {
              id: m.id,
              name: m.name || "Unknown",
              type: m.type || 0,
              flds: Array.isArray(m.flds)
                ? m.flds
                    .map((f: any) => ({ name: f.name, ord: f.ord }))
                    .sort((a: any, b: any) => a.ord - b.ord)
                : [],
            };
          }
        }
      }
      colStmt.free();
    } catch (e) {
      console.warn("Aviso: n\u00e3o foi poss\u00edvel ler modelos do col:", e);
    }

    // ═══════════ EXTRAIR DECKS DO ANKI ═══════════
    const ankiDecks: Record<number, AnkiDeck> = {};
    try {
      const colStmt = sqliteDb.prepare("SELECT decks FROM col LIMIT 1");
      if (colStmt.step()) {
        const decksJson = colStmt.getAsObject().decks as string;
        if (decksJson) {
          const parsedDecks = JSON.parse(decksJson);
          for (const key in parsedDecks) {
            const d = parsedDecks[key];
            ankiDecks[d.id] = {
              id: d.id,
              name: cleanDeckName(d.name || "Default"),
            };
          }
        }
      }
      colStmt.free();
    } catch (e) {
      console.warn("Aviso: n\u00e3o foi poss\u00edvel ler decks do col:", e);
    }

    // ═══════════ MAPEAR NOTES → CARDS (deck association via cards table) ═══════════
    // No Anki, a tabela `cards` vincula notes a decks. Uma nota pode gerar N cards.
    // Precisamos: note.flds + note.mid + card.did (deck id)
    const noteToDecks: Record<number, number> = {};
    try {
      const cardsStmt = sqliteDb.prepare("SELECT nid, did FROM cards");
      while (cardsStmt.step()) {
        const row = cardsStmt.getAsObject();
        const nid = row.nid as number;
        const did = row.did as number;
        // Se a nota já está mapeada, mantém o primeiro deck
        if (!noteToDecks[nid]) {
          noteToDecks[nid] = did;
        }
      }
      cardsStmt.free();
    } catch (e) {
      console.warn("Aviso: n\u00e3o foi poss\u00edvel ler cards table:", e);
    }

    // ═══════════ EXTRAIR E PROCESSAR NOTAS ═══════════
    const parsedCards: ParsedCard[] = [];
    try {
      const notesStmt = sqliteDb.prepare("SELECT id, mid, flds, tags FROM notes");
      while (notesStmt.step()) {
        const row = notesStmt.getAsObject();
        const noteId = row.id as number;
        const mid = row.mid as number;
        const flds = row.flds as string;
        const fields = flds.split("\x1f");

        const model = models[mid];
        const isCloze = model?.type === 1;

        let front = "";
        let back = "";
        let extra = "";

        if (isCloze) {
          // Para cloze, o front é o campo com as lacunas e o back é a versão completa
          const rawText = fields[0] || "";
          // Front: mostra as lacunas como [...] com hint
          front = cleanAnkiHtml(
            rawText.replace(/\{\{c\d+::(.*?)(?:::(.*?))?\}\}/g, (_, _ans, hint) =>
              hint ? `[${hint}]` : "[...]"
            )
          );
          // Back: mostra as respostas
          back = cleanAnkiHtml(rawText);

          if (fields.length > 1) {
            extra = cleanAnkiHtml(fields.slice(1).join("\n")).substring(0, 500);
          }
        } else {
          // Modelo padrão: primeiro campo = front, segundo = back
          front = cleanAnkiHtml(fields[0] || "");
          back = cleanAnkiHtml(fields[1] || "");

          if (fields.length > 2) {
            extra = cleanAnkiHtml(fields.slice(2).join("\n")).substring(0, 500);
          }
        }

        // Pula cards sem conteúdo real
        if (!front.trim() && !back.trim()) continue;
        if (!front.trim()) front = "(Sem frente)";
        if (!back.trim()) back = "(Sem verso)";

        const ankiDeckId = noteToDecks[noteId] || 1;

        parsedCards.push({ front, back, extra, ankiDeckId });
      }
      notesStmt.free();
    } catch (e) {
      sqliteDb.close();
      return NextResponse.json(
        { error: "Erro ao ler notas do banco Anki: " + (e as Error).message },
        { status: 500 }
      );
    }

    sqliteDb.close();

    if (parsedCards.length === 0) {
      return NextResponse.json(
        { error: "O arquivo APKG n\u00e3o cont\u00e9m nenhum card v\u00e1lido." },
        { status: 400 }
      );
    }

    // ═══════════ MODO MERGE: ADICIONAR A DECK EXISTENTE ═══════════
    if (mode === "merge" && targetDeckId) {
      // Busca cards existentes no deck alvo para deduplicação
      const existingCards = await db.card.findMany({
        where: { deckId: targetDeckId },
        select: { front: true },
      });
      const existingFronts = new Set(
        existingCards.map((c) => c.front.trim().toLowerCase())
      );

      const cardsToInsert: { deckId: string; front: string; back: string; extra: string; nextReviewDate: Date }[] = [];
      let skipped = 0;

      for (const card of parsedCards) {
        const key = card.front.trim().toLowerCase();
        if (existingFronts.has(key)) {
          skipped++;
          continue;
        }
        existingFronts.add(key); // Evita duplicatas dentro do próprio APKG
        cardsToInsert.push({
          deckId: targetDeckId,
          front: card.front,
          back: card.back,
          extra: card.extra || "",
          nextReviewDate: new Date(),
        });
      }

      // Inserir em chunks
      const chunkSize = 50;
      for (let i = 0; i < cardsToInsert.length; i += chunkSize) {
        const chunk = cardsToInsert.slice(i, i + chunkSize);
        await db.card.createMany({ data: chunk });
      }

      const targetDeck = await db.deck.findUnique({ where: { id: targetDeckId } });

      return NextResponse.json({
        success: true,
        decks: [
          {
            id: targetDeckId,
            title: targetDeck?.title || "Baralho",
            importedCards: cardsToInsert.length,
            skippedDuplicates: skipped,
          },
        ],
        totalImported: cardsToInsert.length,
        totalSkipped: skipped,
      });
    }

    // ═══════════ MODO NEW: CRIAR DECKS NOVOS ═══════════
    // Agrupa cards por deck de origem no Anki
    const cardsByDeck: Record<number, ParsedCard[]> = {};
    for (const card of parsedCards) {
      if (!cardsByDeck[card.ankiDeckId]) {
        cardsByDeck[card.ankiDeckId] = [];
      }
      cardsByDeck[card.ankiDeckId].push(card);
    }

    const deckResults: { id: string; title: string; importedCards: number; skippedDuplicates: number }[] = [];
    let totalImported = 0;
    let totalSkipped = 0;

    // Se há apenas 1 deck (ou todos os cards estão no Default), cria um deck só
    const deckIds = Object.keys(cardsByDeck).map(Number);
    const nonDefaultDecks = deckIds.filter((id) => {
      const name = ankiDecks[id]?.name;
      return name && name !== "Default";
    });

    // Usa nome do arquivo como fallback
    const fileBaseName = file.name.replace(/\.apkg$/i, "");

    for (const ankiDeckId of deckIds) {
      const cards = cardsByDeck[ankiDeckId];
      if (!cards || cards.length === 0) continue;

      let deckTitle: string;
      if (nonDefaultDecks.length === 0) {
        // Todos os cards estão no Default — usa nome do arquivo
        deckTitle = fileBaseName;
      } else if (ankiDecks[ankiDeckId]) {
        deckTitle = ankiDecks[ankiDeckId].name;
        if (deckTitle === "Default" && nonDefaultDecks.length > 0) {
          // Pula o deck Default se existem outros decks com cards
          continue;
        }
      } else {
        deckTitle = fileBaseName;
      }

      // Criar novo deck
      const newDeck = await db.deck.create({
        data: {
          title: deckTitle,
          description: `Importado do Anki (${cards.length} cards)`,
          icon: getDeckIcon(deckTitle),
          color: "#10b981",
        },
      });

      // Deduplicar dentro do batch
      const seenFronts = new Set<string>();
      const cardsToInsert: { deckId: string; front: string; back: string; extra: string; nextReviewDate: Date }[] = [];
      let skipped = 0;

      for (const card of cards) {
        const key = card.front.trim().toLowerCase();
        if (seenFronts.has(key)) {
          skipped++;
          continue;
        }
        seenFronts.add(key);
        cardsToInsert.push({
          deckId: newDeck.id,
          front: card.front,
          back: card.back,
          extra: card.extra || "",
          nextReviewDate: new Date(),
        });
      }

      // Inserir em chunks
      const chunkSize = 50;
      for (let i = 0; i < cardsToInsert.length; i += chunkSize) {
        const chunk = cardsToInsert.slice(i, i + chunkSize);
        await db.card.createMany({ data: chunk });
      }

      deckResults.push({
        id: newDeck.id,
        title: deckTitle,
        importedCards: cardsToInsert.length,
        skippedDuplicates: skipped,
      });
      totalImported += cardsToInsert.length;
      totalSkipped += skipped;
    }

    return NextResponse.json({
      success: true,
      decks: deckResults,
      totalImported,
      totalSkipped,
    });
  } catch (error: any) {
    console.error("Erro na importa\u00e7\u00e3o APKG:", error);
    return NextResponse.json(
      { error: "Erro ao importar: " + error.message },
      { status: 500 }
    );
  }
}
