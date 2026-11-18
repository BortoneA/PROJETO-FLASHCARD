import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSqlJs } from "@/lib/sqlite";
import JSZip from "jszip";
import { extractDeckTags } from "@/lib/exportRetentionCSV";

export const dynamic = "force-dynamic";

// ═══════════════════════════════════════════════════════════════════
// APKG EXPORT ENGINE — Exportador Nativo e Universal Anki
// Total compatibilidade com Anki Desktop (2.1.x, 23.x, 24.x), AnkiMobile e AnkiDroid:
// • Modelos Dual: Basic (Standard) e Cloze (Omissão de Palavras)
// • Extração e empacotamento real de mídias/imagens para o arquivo ZIP
// • Preservação precisa de agendamento SRS (SM-2: Ease, Reps, Lapses, Intervalo e Due Date)
// • Exportação de tags semânticas no padrão oficial da Anki (notes.tags)
// • Exportação individual por baralho ou da coleção completa ("all")
// • Suporte a collection.anki2 e collection.anki21
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId");

    // Determina se deve exportar todos os baralhos ou um específico
    const exportAll = !deckId || deckId === "all";

    let decksToExport: any[] = [];
    if (exportAll) {
      decksToExport = await db.deck.findMany({
        include: { cards: true },
        orderBy: { createdAt: "asc" },
      });
      if (decksToExport.length === 0) {
        return NextResponse.json({ error: "Nenhum baralho disponível para exportação." }, { status: 404 });
      }
    } else {
      const singleDeck = await db.deck.findUnique({
        where: { id: deckId },
        include: { cards: true },
      });
      if (!singleDeck) {
        return NextResponse.json({ error: "Baralho não encontrado." }, { status: 404 });
      }
      decksToExport = [singleDeck];
    }

    // Inicializa o motor SQLite em WebAssembly / Node
    const SQL = await getSqlJs();
    const sqliteDb = new SQL.Database();

    // ── ESTRUTURA DO BANCO ANKI (collection.anki2 / anki21) ──
    sqliteDb.run(`
      CREATE TABLE col (
        id integer primary key,
        crt integer not null,
        mod integer not null,
        scm integer not null,
        ver integer not null,
        dvc integer not null,
        dirty integer not null,
        usn integer not null,
        ls integer not null,
        conf text not null,
        models text not null,
        decks text not null,
        dconf text not null,
        tags text not null
      );
    `);

    sqliteDb.run(`
      CREATE TABLE notes (
        id integer primary key,
        guid text not null,
        mid integer not null,
        mod integer not null,
        usn integer not null,
        tags text not null,
        flds text not null,
        sfld text not null,
        csum integer not null,
        flags integer not null,
        data text not null
      );
    `);

    sqliteDb.run(`
      CREATE TABLE cards (
        id integer primary key,
        nid integer not null,
        did integer not null,
        ord integer not null,
        mod integer not null,
        usn integer not null,
        type integer not null,
        queue integer not null,
        due integer not null,
        ivl integer not null,
        factor integer not null,
        reps integer not null,
        lapses integer not null,
        left integer not null,
        odue integer not null,
        odid integer not null,
        flags integer not null,
        data text not null
      );
    `);

    sqliteDb.run(`
      CREATE TABLE revlog (
        id integer primary key,
        cid integer not null,
        usn integer not null,
        ease integer not null,
        ivl integer not null,
        lastIvl integer not null,
        factor integer not null,
        time integer not null,
        type integer not null
      );
    `);

    sqliteDb.run(`
      CREATE TABLE graves (
        usn integer not null,
        oid integer not null,
        type integer not null
      );
    `);

    const now = Math.floor(Date.now() / 1000);
    const crtDay = Math.floor(now / 86400);

    // ── DEFINIÇÃO DOS MODELOS (NOTETYPES) ──
    const basicModelId = 1600000000001;
    const clozeModelId = 1600000000002;

    const modelsMap: Record<string, any> = {
      [basicModelId]: {
        id: basicModelId,
        name: "Kortex Basic",
        type: 0, // Standard model
        mod: now,
        usn: 0,
        sortf: 0,
        did: 1,
        flds: [
          { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
          { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
          { name: "Extra", ord: 2, sticky: false, rtl: false, font: "Arial", size: 16 },
        ],
        tmpls: [
          {
            name: "Card 1",
            ord: 0,
            qfmt: "{{Front}}",
            afmt: "{{FrontSide}}<hr id=answer>{{Back}}{{#Extra}}<br><br><div style='font-size:14px;color:#666;'>{{Extra}}</div>{{/Extra}}",
          },
        ],
        css: ".card { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 19px; text-align: center; color: #1e293b; background-color: #ffffff; padding: 20px; }\n.nightMode .card { color: #f1f5f9; background-color: #0f172a; }\nimg { max-width: 95%; height: auto; border-radius: 8px; margin: 12px auto; display: block; }\nhr#answer { border: 0; height: 1px; background: #cbd5e1; margin: 20px 0; }",
        req: [[0, "all", [0]]],
      },
      [clozeModelId]: {
        id: clozeModelId,
        name: "Kortex Cloze",
        type: 1, // Cloze model
        mod: now,
        usn: 0,
        sortf: 0,
        did: 1,
        flds: [
          { name: "Text", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
          { name: "Extra", ord: 1, sticky: false, rtl: false, font: "Arial", size: 16 },
        ],
        tmpls: [
          {
            name: "Cloze",
            ord: 0,
            qfmt: "{{cloze:Text}}",
            afmt: "{{cloze:Text}}{{#Extra}}<br><br><div style='font-size:14px;color:#666;'>{{Extra}}</div>{{/Extra}}",
          },
        ],
        css: ".card { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 19px; text-align: center; color: #1e293b; background-color: #ffffff; padding: 20px; }\n.nightMode .card { color: #f1f5f9; background-color: #0f172a; }\n.cloze { font-weight: bold; color: #2563eb; }\n.nightMode .cloze { color: #38bdf8; }\nimg { max-width: 95%; height: auto; border-radius: 8px; margin: 12px auto; display: block; }",
        req: [[0, "all", [0]]],
      },
    };

    // ── DEFINIÇÃO DOS BARALHOS (DECKS) ──
    const decksMap: Record<string, any> = {};
    const deckIdMap: Record<string, number> = {};

    decksToExport.forEach((deck, idx) => {
      const ankiDeckId = 1600000000000 + (idx + 1) * 10;
      deckIdMap[deck.id] = ankiDeckId;

      decksMap[ankiDeckId] = {
        id: ankiDeckId,
        mod: now,
        name: deck.title,
        usn: 0,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: false,
        desc: deck.description || "",
        dyn: 0,
        conf: 1,
      };
    });

    // ── EMPACOTAMENTO DE MÍDIA REAL ──
    const zip = new JSZip();
    const mediaJson: Record<string, string> = {};
    let mediaCounter = 0;

    /**
     * Processa imagens (Data URL ou URL) e empacota no ZIP da Anki.
     */
    const processImageToAnki = (rawImageSrc: string): string => {
      if (!rawImageSrc) return "";

      // Se for Data URL em base64: data:image/png;base64,...
      const dataUrlMatch = rawImageSrc.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (dataUrlMatch) {
        let ext = dataUrlMatch[1].replace("+xml", "").toLowerCase();
        if (ext === "jpeg") ext = "jpg";
        const base64Data = dataUrlMatch[2];

        try {
          const buffer = Buffer.from(base64Data, "base64");
          const zipIndex = String(mediaCounter++);
          const originalFilename = `kortex_media_${zipIndex}.${ext}`;

          zip.file(zipIndex, buffer);
          mediaJson[zipIndex] = originalFilename;

          return `<img src="${originalFilename}">`;
        } catch {
          return "";
        }
      }

      // Se for URL externa, mantém a tag normal
      if (rawImageSrc.startsWith("http://") || rawImageSrc.startsWith("https://")) {
        return `<img src="${rawImageSrc}">`;
      }

      return "";
    };

    /**
     * Substitui imagens base64 inline no HTML do card e empacota
     */
    const sanitizeHtmlAndExtractImages = (htmlText: string): string => {
      if (!htmlText) return "";

      return htmlText.replace(
        /<img[^>]+src=["'](data:image\/[^"']+)["'][^>]*>/gi,
        (_, dataUrl) => {
          return processImageToAnki(dataUrl);
        }
      );
    };

    // Coletor de tags globais
    const allTagsSet = new Set<string>();

    // ── INSERÇÃO DE NOTAS E CARDS ──
    let globalNoteIndex = 0;

    for (const deck of decksToExport) {
      const ankiDeckId = deckIdMap[deck.id];
      const deckTags = extractDeckTags(deck);

      for (const card of deck.cards) {
        globalNoteIndex++;
        const noteId = 1600000000000 + globalNoteIndex * 10;
        const cardAnkiId = noteId + 1;

        // Limpa e extrai imagens inline
        let frontHtml = sanitizeHtmlAndExtractImages(card.front || "");
        let backHtml = sanitizeHtmlAndExtractImages(card.back || "");
        let extraHtml = sanitizeHtmlAndExtractImages(card.extra || "");

        // Se tiver imageUrl explícita no card, adiciona no verso/frente
        if (card.imageUrl) {
          const imgTag = processImageToAnki(card.imageUrl);
          if (imgTag) {
            backHtml += `<br>${imgTag}`;
          }
        }

        // Detecta se é Cloze (omissão de palavras)
        const isCloze =
          frontHtml.includes("{{c") || backHtml.includes("{{c") || (card.extra && card.extra.includes("{{c"));

        const modelId = isCloze ? clozeModelId : basicModelId;

        // Monta os campos de acordo com o modelo
        let fieldsStr = "";
        let sortField = "";

        if (isCloze) {
          // No Anki, Cloze armazena o texto principal no campo 1 (Text) e notas no campo 2 (Extra)
          const clozeText = frontHtml.includes("{{c") ? frontHtml : `${frontHtml}<br>${backHtml}`;
          fieldsStr = `${clozeText}\x1f${extraHtml}`;
          sortField = frontHtml.replace(/\{\{c\d+::(.*?)(?:::(.*?))?\}\}/g, "$1").substring(0, 80);
        } else {
          fieldsStr = `${frontHtml}\x1f${backHtml}\x1f${extraHtml}`;
          sortField = frontHtml.substring(0, 80);
        }

        // Formata tags no padrão Anki (espaço no início e no fim: " tag1 tag2 ")
        const cardTagsList = Array.from(
          new Set([...deckTags, ...extractDeckTags({ title: card.front, description: card.extra })])
        ).map((t) => t.replace(/^#/, "").toLowerCase().trim()).filter(Boolean);

        cardTagsList.forEach((t) => allTagsSet.add(t));
        const tagsStr = cardTagsList.length > 0 ? ` ${cardTagsList.join(" ")} ` : "";

        // GUID determinístico baseado no ID único do card
        const guid = `kortex-${card.id}`;

        // Insere Nota
        sqliteDb.run(
          `INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, 0, 0, '');`,
          [noteId, guid, modelId, now, tagsStr, fieldsStr, sortField]
        );

        // ── CALCULA AGENDAMENTO SRS (SM-2 CALIBRADO) ──
        const reps = Math.max(0, card.repetitions || 0);
        const lapses = Math.max(0, card.lapses || 0);
        const interval = Math.max(0, card.interval || 0);
        const factor = Math.round((card.easeFactor || 2.5) * 1000);

        let type = 0; // 0 = New, 1 = Learning, 2 = Review
        let queue = 0; // 0 = New, 2 = Review
        let due = globalNoteIndex; // Ordem para novos cards

        if (reps > 0) {
          type = 2; // Review
          queue = 2; // Review

          if (card.nextReviewDate) {
            const nextDay = Math.floor(new Date(card.nextReviewDate).getTime() / (86400 * 1000));
            due = Math.max(0, nextDay - crtDay);
          } else {
            due = interval;
          }
        }

        // Insere Card
        sqliteDb.run(
          `INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, '');`,
          [cardAnkiId, noteId, ankiDeckId, now, type, queue, due, interval, factor, reps, lapses]
        );
      }
    }

    // ── MONTA COLUNA col ──
    const tagsObj: Record<string, number> = {};
    allTagsSet.forEach((t) => {
      tagsObj[t] = 0;
    });

    sqliteDb.run(
      `INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, 0, '{}', ?, ?, '{}', ?);`,
      [now, now, now, JSON.stringify(modelsMap), JSON.stringify(decksMap), JSON.stringify(tagsObj)]
    );

    // Exporta o banco SQLite como Uint8Array
    const sqliteBinary = sqliteDb.export();
    sqliteDb.close();

    // Empacota collection.anki2 e collection.anki21 (para suporte unificado Anki 2.0 a 24.x)
    zip.file("collection.anki2", sqliteBinary);
    zip.file("collection.anki21", sqliteBinary);
    zip.file("media", JSON.stringify(mediaJson));

    // Gera o arquivo .apkg binário final
    const zipBuffer = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const exportFileName = exportAll
      ? "Colecao_Completa_Kortex.apkg"
      : `${decksToExport[0].title.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, "_")}.apkg`;

    return new Response(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/apkg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(exportFileName)}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("Erro fatal ao exportar pacote APKG:", err);
    return NextResponse.json(
      { error: "Erro interno durante exportação do pacote APKG: " + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
