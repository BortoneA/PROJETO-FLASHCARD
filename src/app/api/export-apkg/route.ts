import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import initSqlJs from "sql.js";
import JSZip from "jszip";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get("deckId");

  if (!deckId) {
    return NextResponse.json({ error: "deckId é obrigatório" }, { status: 400 });
  }

  const deck = await db.deck.findUnique({
    where: { id: deckId },
    include: { cards: true },
  });

  if (!deck) {
    return NextResponse.json({ error: "Baralho não encontrado" }, { status: 404 });
  }

  // Inicializa o motor SQLite em WebAssembly / Node
  const SQL = await initSqlJs();
  const sqliteDb = new SQL.Database();

  // Cria a estrutura do banco Anki (collection.anki2)
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
  const deckAnkiId = 1500000000000;
  const modelAnkiId = 1500000000001;

  const modelsJson = JSON.stringify({
    [modelAnkiId]: {
      id: modelAnkiId,
      name: "Basic",
      type: 0,
      mod: now,
      usn: 0,
      sortf: 0,
      did: deckAnkiId,
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
      ],
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: "{{FrontSide}}<hr id=answer>{{Back}}",
        },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
      req: [[0, "all", [0]]],
    },
  });

  const decksJson = JSON.stringify({
    [deckAnkiId]: {
      id: deckAnkiId,
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
    },
  });

  sqliteDb.run(
    `INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, 0, '{}', ?, ?, '{}', '{}');`,
    [now, now, now, modelsJson, decksJson]
  );

  // Insere os cards no SQLite
  deck.cards.forEach((card, index) => {
    const noteId = Date.now() + index * 10;
    const cardAnkiId = noteId + 1;
    const fieldsStr = `${card.front}\x1f${card.back}${card.extra ? `<br><br><i>${card.extra}</i>` : ""}`;

    sqliteDb.run(
      `INSERT INTO notes VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '');`,
      [noteId, `guid-${card.id}`, modelAnkiId, now, fieldsStr, card.front]
    );

    sqliteDb.run(
      `INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, ?, ?, ?, ?, 0, 0, 0, 0, '');`,
      [
        cardAnkiId,
        noteId,
        deckAnkiId,
        now,
        card.repetitions,
        card.interval,
        Math.round(card.easeFactor * 1000),
        card.repetitions,
        card.lapses,
      ]
    );
  });

  // Exporta o banco SQLite como Uint8Array
  const sqliteBinary = sqliteDb.export();

  // Compacta no arquivo ZIP (formato .apkg do Anki)
  const zip = new JSZip();
  zip.file("collection.anki2", sqliteBinary);
  zip.file("media", "{}");

  const zipBuffer = await zip.generateAsync({ type: "uint8array" });

  const sanitizedFileName = deck.title.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new Response(zipBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/apkg",
      "Content-Disposition": `attachment; filename="${sanitizedFileName}.apkg"`,
    },
  });
}
