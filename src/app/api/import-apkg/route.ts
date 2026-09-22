import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import initSqlJs from "sql.js";
import JSZip from "jszip";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const collectionFile = zip.file("collection.anki2");
    if (!collectionFile) {
      return NextResponse.json({ error: "Arquivo n\u00e3o \u00e9 um pacote Anki v\u00e1lido (.apkg)" }, { status: 400 });
    }

    const sqliteBuffer = await collectionFile.async("uint8array");
    const SQL = await initSqlJs();
    const sqliteDb = new SQL.Database(sqliteBuffer);

    // Extract deck name (just take the first one that is not "Default")
    const colStmt = sqliteDb.prepare("SELECT decks FROM col LIMIT 1");
    let deckName = file.name.replace(".apkg", "");
    if (colStmt.step()) {
      const decksJson = colStmt.getAsObject().decks as string;
      const decks = JSON.parse(decksJson);
      for (const key in decks) {
        if (decks[key].name !== "Default") {
          deckName = decks[key].name;
          break;
        }
      }
    }
    colStmt.free();

    // Create a new deck in our DB
    const newDeck = await db.deck.create({
      data: {
        title: deckName,
        description: "Importado do Anki",
        icon: "\uD83D\uDCE6",
        color: "#10b981", // Emerald
      }
    });

    // Extract notes
    // We'll join cards and notes to only get cards that exist, but just reading notes is simpler if we assume 1 card per note.
    // However, anki cards table contains the schedule. For now, let's just extract all notes and make them new cards in our system.
    const notesStmt = sqliteDb.prepare("SELECT id, flds, tags FROM notes");
    
    const cardsToCreate = [];
    while (notesStmt.step()) {
      const row = notesStmt.getAsObject();
      const flds = row.flds as string;
      const fields = flds.split("\x1f");
      const front = fields[0] || "Frente Vazia";
      const back = fields[1] || "Verso Vazio";
      
      let extra = "";
      if (fields.length > 2) {
        extra = fields.slice(2).join("\n").substring(0, 500); // limit size
      }

      // strip HTML from front and back for simplicity, or we can keep it since our markdown might support it
      cardsToCreate.push({
        deckId: newDeck.id,
        front: front,
        back: back,
        extra: extra,
        nextReviewDate: new Date(),
      });
    }
    notesStmt.free();

    // Insert into DB in chunks to avoid overwhelming Neon
    const chunkSize = 50;
    for (let i = 0; i < cardsToCreate.length; i += chunkSize) {
      const chunk = cardsToCreate.slice(i, i + chunkSize);
      await db.card.createMany({
        data: chunk,
      });
    }

    return NextResponse.json({ success: true, deckId: newDeck.id, importedCards: cardsToCreate.length });
  } catch (error: any) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ error: "Erro ao importar: " + error.message }, { status: 500 });
  }
}
