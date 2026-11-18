import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSqlJs } from "@/lib/sqlite";
import JSZip from "jszip";
import { decompress as zstdDecompress } from "fzstd";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════
// APKG IMPORT ENGINE — Leitor Nativo e Completo de Pacotes Anki
// Suporte avançado:
// • collection.anki2 (Legado v11)
// • collection.anki21 (Moderno v14/v15/v16)
// • collection.anki21b (Zstandard comprimido Anki 2.1.50+ / 23.x / 24.x)
// • Modelos com múltiplos cards (Invertidos, Vocabulário com várias faces)
// • Cloze deletions por card (c1, c2, c3 isolados com precisão)
// • Renderização de templates Anki (qfmt/afmt com condicionais {{#Field}})
// • Suporte a mídia/imagens embutidas (convertidas para Data URL com segurança)
// • LaTeX e MathJax ([$]...[/$], \(...\), \[...\])
// • Limpeza profunda de HTML sujo (remove <style>, <script>, tags órfãs)
// • Deduplicação inteligente de cards (Front + Back)
// • Preservação de agendamento SRS existente (Ease, Reps, Intervalo)
// • Modos: "new" (cria decks isolados) ou "merge" (soma a deck existente)
// ═══════════════════════════════════════════════════════════════════

interface AnkiModelTemplate {
  name: string;
  ord: number;
  qfmt: string;
  afmt: string;
}

interface AnkiModelField {
  name: string;
  ord: number;
}

interface AnkiModel {
  id: number;
  name: string;
  type: number; // 0 = standard, 1 = cloze
  flds: AnkiModelField[];
  tmpls: AnkiModelTemplate[];
}

interface AnkiDeck {
  id: number;
  name: string;
}

interface ProcessedCard {
  deckId: number;
  front: string;
  back: string;
  extra: string;
  tags: string[];
  imageUrl?: string | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  status: string;
  nextReviewDate: Date;
}

/**
 * Normaliza o nome do deck hierárquico do Anki.
 * "Medicina::Farmacologia::Antibioticos" -> "Medicina - Farmacologia - Antibioticos"
 */
function cleanDeckName(name: string): string {
  return name.replace(/::/g, " - ").trim();
}

/**
 * Seleciona um emoji contextual para o deck importado.
 */
function getDeckIcon(name: string): string {
  const lower = name.toLowerCase();
  if (/\b(ingl[eê]s|english|toefl|ielts)\b/i.test(lower)) return "\uD83C\uDDEC\uD83C\uDDE7";
  if (/\b(espanhol|spanish|espa[ñn]ol)\b/i.test(lower)) return "\uD83C\uDDEA\uD83C\uDDF8";
  if (/\b(franc[eê]s|french|fran[cç]ais)\b/i.test(lower)) return "\uD83C\uDDEB\uD83C\uDDF7";
  if (/\b(alem[aã]o|german|deutsch)\b/i.test(lower)) return "\uD83C\uDDE9\uD83C\uDDEA";
  if (/\b(portugu[eê]s|portuguese|gram[aá]tica)\b/i.test(lower)) return "\uD83C\uDDE7\uD83C\uDDF7";
  if (/\b(japon[eê]s|japanese|nihongo|kanji|hiragana)\b/i.test(lower)) return "\uD83C\uDDEF\uD83C\uDDF5";
  if (/\b(italiano|italian)\b/i.test(lower)) return "\uD83C\uDDEE\uD83C\uDDF9";
  if (/\b(chin[eê]s|mandarim|chinese|hanzi)\b/i.test(lower)) return "\uD83C\uDDE8\uD83C\uDDF3";
  if (/\b(matem[aá]tica|math|c[aá]lculo|f[oó]rmula)\b/i.test(lower)) return "\uD83D\uDCCA";
  if (/\b(hist[oó]ria|history)\b/i.test(lower)) return "\uD83D\uDCDC";
  if (/\b(ci[eê]ncia|science|biolog|qu[ií]mica|f[ií]sica)\b/i.test(lower)) return "\uD83E\uDDEC";
  if (/\b(medicina|medicine|anatom|saude|sa[uú]de|farmac|clinica)\b/i.test(lower)) return "\uD83E\uDE7A";
  if (/\b(direito|law|jur[ií]d|oab|concurso)\b/i.test(lower)) return "\u2696\uFE0F";
  if (/\b(programa|code|develop|software|python|javascript|ti)\b/i.test(lower)) return "\uD83D\uDCBB";
  if (/\b(geograf|geography|pa[ií]ses|capitais)\b/i.test(lower)) return "\uD83C\uDF0D";
  if (/\b(m[uú]sica|music|viol[aã]o|teoria)\b/i.test(lower)) return "\uD83C\uDFB5";
  if (/\b(filosof|sociolog|livro|literatura)\b/i.test(lower)) return "\uD83D\uDCD6";
  return "\uD83D\uDCE6"; // 📦 default
}

/**
 * Limpa HTML do Anki para Markdown limpo e amigável.
 * Resolve imagens embutidas usando o mapa de mídia do pacote.
 */
function cleanAnkiHtml(
  html: string,
  mediaResolver?: (filename: string) => { dataUrl?: string; mimeType?: string } | null,
  extractedImagesCollector?: string[]
): string {
  if (!html) return "";

  let text = html;

  // 1. Remove blocos <style>...</style> e <script>...</script> completamente
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // 2. Normaliza LaTeX e MathJax
  text = text.replace(/\[\$\$\]([\s\S]*?)\[\/\$\$\]/gi, "\n$$\n$1\n$$\n");
  text = text.replace(/\[\$\]([\s\S]*?)\[\/\$\]/gi, " $$1$ ");
  text = text.replace(/\\\[([\s\S]*?)\\\]/gi, "\n$$\n$1\n$$\n");
  text = text.replace(/\\\(([\s\S]*?)\\\)/gi, " $$1$ ");

  // 3. Processa imagens <img src="...">
  text = text.replace(/<img[^>]+src=["']?([^"'>\s]+)["']?[^>]*alt=["']?([^"'>]*)["']?[^>]*\/?>/gi, (match, src, alt) => {
    return handleImageTag(src, alt, mediaResolver, extractedImagesCollector);
  });
  text = text.replace(/<img[^>]+src=["']?([^"'>\s]+)["']?[^>]*\/?>/gi, (match, src) => {
    return handleImageTag(src, "", mediaResolver, extractedImagesCollector);
  });

  // 4. Converte tags estruturais
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n### $1\n");

  // 5. Preserva formatações básicas em Markdown
  text = text.replace(/<(b|strong)>(.*?)<\/\1>/gi, "**$2**");
  text = text.replace(/<(b|strong)\s[^>]*>(.*?)<\/\1>/gi, "**$2**");
  text = text.replace(/<(i|em)>(.*?)<\/\1>/gi, "*$2*");
  text = text.replace(/<(i|em)\s[^>]*>(.*?)<\/\1>/gi, "*$2*");
  text = text.replace(/<u>(.*?)<\/u>/gi, "__$1__");
  text = text.replace(/<u\s[^>]*>(.*?)<\/u>/gi, "__$1__");
  text = text.replace(/<sup>(.*?)<\/sup>/gi, "^($1)");
  text = text.replace(/<sub>(.*?)<\/sub>/gi, "_($1)");
  text = text.replace(/<code>(.*?)<\/code>/gi, "`$1`");
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // 6. Remove referências a sons locais do Anki [sound:file.mp3]
  text = text.replace(/\[sound:[^\]]+\]/gi, "");

  // 7. Remove todas as outras tags HTML residuais
  text = text.replace(/<[^>]+>/g, "");

  // 8. Decodifica HTML Entities
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&apos;/gi, "'");
  text = text.replace(/&mdash;/gi, "—");
  text = text.replace(/&ndash;/gi, "–");
  text = text.replace(/&hellip;/gi, "…");
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // 9. Limpeza de espaçamentos em branco repetidos
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function handleImageTag(
  src: string,
  alt: string,
  mediaResolver?: (filename: string) => { dataUrl?: string; mimeType?: string } | null,
  extractedImagesCollector?: string[]
): string {
  // Se for URL externa (http/https ou data URL pronta)
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    if (extractedImagesCollector && !extractedImagesCollector.includes(src)) {
      extractedImagesCollector.push(src);
    }
    return `\n![${alt || "Imagem"}](${src})\n`;
  }

  // Se tiver um resolvedor de mídia do arquivo .apkg
  if (mediaResolver) {
    const cleanSrc = decodeURIComponent(src).replace(/^(\.\/|\/)/, "");
    const resolved = mediaResolver(cleanSrc);
    if (resolved?.dataUrl) {
      if (extractedImagesCollector && !extractedImagesCollector.includes(resolved.dataUrl)) {
        extractedImagesCollector.push(resolved.dataUrl);
      }
      return `\n![${alt || cleanSrc}](${resolved.dataUrl})\n`;
    }
  }

  // Fallback: indica que existia uma imagem com aquele nome
  return alt ? ` [Imagem: ${alt}] ` : ` [Imagem: ${src}] `;
}

/**
 * Renderiza um card do tipo Cloze (omissão de palavras) para um `ord` específico.
 * Na Anki:
 * - c1 corresponde a ord = 0
 * - c2 corresponde a ord = 1, etc.
 * Na pergunta (front): o cloze alvo é escondido com [...] ou [dica]. Outros clozes são revelados!
 * Na resposta (back): o cloze alvo é destacado em negrito (**resposta**).
 */
function renderClozeCard(
  rawText: string,
  ord: number,
  allFields: string[],
  cleanFn: (t: string) => string
): { front: string; back: string; extra: string } {
  const targetNumber = ord + 1;
  const clozeRegex = /\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/g;

  // Front: Alvo escondido; Outros clozes mostram o conteúdo
  const frontRaw = rawText.replace(clozeRegex, (_, cNum, ans, hint) => {
    const n = parseInt(cNum, 10);
    if (n === targetNumber) {
      return hint ? `[${hint}]` : "[...]";
    }
    return ans;
  });

  // Back: Alvo destacado; Outros clozes mostram o conteúdo
  const backRaw = rawText.replace(clozeRegex, (_, cNum, ans) => {
    const n = parseInt(cNum, 10);
    if (n === targetNumber) {
      return `**${ans}**`;
    }
    return ans;
  });

  const front = cleanFn(frontRaw);
  const back = cleanFn(backRaw);

  let extra = "";
  if (allFields.length > 1) {
    const extraParts = allFields.slice(1).map(cleanFn).filter((t) => t.length > 0);
    extra = extraParts.join("\n\n").substring(0, 1500);
  }

  return { front, back, extra };
}

/**
 * Avalia templates padrão de notetype (Model) do Anki.
 * Suporta condicionais {{#Campo}}...{{/Campo}}, {{^Campo}}...{{/Campo}}
 * e substituição de tags {{Campo}}, {{text:Campo}}, {{FrontSide}}.
 */
function evaluateAnkiTemplate(
  templateStr: string,
  fieldMap: Record<string, string>,
  frontSideRendered?: string
): string {
  let output = templateStr;

  // 1. Condicional positivo: {{#Campo}}conteudo{{/Campo}}
  output = output.replace(/\{\{#([^\}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, fieldName, content) => {
    const val = fieldMap[fieldName]?.trim();
    return val && val.length > 0 ? content : "";
  });

  // 2. Condicional negativo / invertido: {{^Campo}}conteudo{{/Campo}}
  output = output.replace(/\{\{\^([^\}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, fieldName, content) => {
    const val = fieldMap[fieldName]?.trim();
    return !val || val.length === 0 ? content : "";
  });

  // 3. Substitui {{FrontSide}} se disponível
  if (frontSideRendered !== undefined) {
    output = output.replace(/\{\{FrontSide\}\}/gi, frontSideRendered);
  }

  // 4. Substitui campos simples {{Campo}}, {{text:Campo}}, {{cloze:Campo}}
  output = output.replace(/\{\{(?:text:|cloze:)?([^\}]+)\}\}/g, (_, fieldName) => {
    return fieldMap[fieldName] || "";
  });

  return output;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "new"; // "new" ou "merge"
    const targetDeckId = searchParams.get("deckId");

    // Validação do modo merge
    if (mode === "merge" && !targetDeckId) {
      return NextResponse.json(
        { error: "Parâmetro deckId é obrigatório no modo merge." },
        { status: 400 }
      );
    }

    if (mode === "merge") {
      const targetDeck = await db.deck.findUnique({ where: { id: targetDeckId! } });
      if (!targetDeck) {
        return NextResponse.json(
          { error: "Baralho de destino não encontrado no banco de dados." },
          { status: 404 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo .apkg foi enviado." },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 1: DESCOMPACTAR O PACOTE ZIP (.APKG)
    // ═══════════════════════════════════════════════════════════════
    const arrayBuffer = await file.arrayBuffer();
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(arrayBuffer);
    } catch (e: any) {
      return NextResponse.json(
        { error: "O arquivo enviado não é um pacote Anki (.apkg) válido: " + e.message },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 2: LOCALIZAR E DESCOMPRIMIR O BANCO SQLITE
    // Ordem de prioridade:
    // 1. collection.anki21b (Zstandard comprimido - Anki 2.1.50+)
    // 2. collection.anki21 (SQLite moderno)
    // 3. collection.anki2 (SQLite legado v11)
    // 4. Varredura por qualquer arquivo interno com tais extensões
    // ═══════════════════════════════════════════════════════════════
    let sqliteBuffer: Uint8Array | null = null;

    if (zip.file("collection.anki21b")) {
      try {
        const compressed = await zip.file("collection.anki21b")!.async("uint8array");
        sqliteBuffer = zstdDecompress(compressed);
      } catch (err: any) {
        console.warn("Falha ao descomprimir collection.anki21b:", err);
      }
    }

    if (!sqliteBuffer && zip.file("collection.anki21")) {
      sqliteBuffer = await zip.file("collection.anki21")!.async("uint8array");
    }

    if (!sqliteBuffer && zip.file("collection.anki2")) {
      sqliteBuffer = await zip.file("collection.anki2")!.async("uint8array");
    }

    // Fallback: varre qualquer arquivo que termine com anki2/anki21/anki21b
    if (!sqliteBuffer) {
      const allFileNames = Object.keys(zip.files);
      const matchedName = allFileNames.find(
        (f) => f.endsWith(".anki21b") || f.endsWith(".anki21") || f.endsWith(".anki2")
      );
      if (matchedName) {
        const entry = zip.file(matchedName)!;
        if (matchedName.endsWith(".anki21b")) {
          const comp = await entry.async("uint8array");
          sqliteBuffer = zstdDecompress(comp);
        } else {
          sqliteBuffer = await entry.async("uint8array");
        }
      }
    }

    if (!sqliteBuffer) {
      return NextResponse.json(
        {
          error:
            "Arquivo não contém uma coleção Anki válida (collection.anki2, collection.anki21 ou collection.anki21b não encontrado).",
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 3: CONSTRUIR MAPA DE MÍDIA / IMAGENS COM CARREGAMENTO ROBUSTO ASYNC
    // ═══════════════════════════════════════════════════════════════
    const mediaFilenameToZipKey: Record<string, string> = {};
    const mediaFile = zip.file("media");
    if (mediaFile) {
      try {
        const mediaJsonStr = await mediaFile.async("string");
        const parsed = JSON.parse(mediaJsonStr);
        for (const [zipKey, originalName] of Object.entries(parsed)) {
          if (typeof originalName === "string") {
            mediaFilenameToZipKey[originalName.toLowerCase()] = zipKey;
            mediaFilenameToZipKey[originalName] = zipKey;
          }
        }
      } catch (e) {
        console.warn("Aviso ao ler mapa de mídia:", e);
      }
    }

    // Cache em memória de Data URLs resolvidas para evitar reprocessamento
    const resolvedMediaCache = new Map<string, { dataUrl?: string; mimeType?: string } | null>();

    // Pré-carrega de forma robusta e assíncrona todas as imagens do pacote (.png, .jpg, .jpeg, .gif, .svg, .webp)
    for (const [lowerKey, zipKey] of Object.entries(mediaFilenameToZipKey)) {
      if (resolvedMediaCache.has(lowerKey)) continue;

      let mimeType = "image/jpeg";
      if (lowerKey.endsWith(".png")) mimeType = "image/png";
      else if (lowerKey.endsWith(".gif")) mimeType = "image/gif";
      else if (lowerKey.endsWith(".svg")) mimeType = "image/svg+xml";
      else if (lowerKey.endsWith(".webp")) mimeType = "image/webp";
      else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) mimeType = "image/jpeg";
      else continue;

      const zipEntry = zip.file(zipKey);
      if (zipEntry) {
        try {
          const bytes = await zipEntry.async("uint8array");
          if (bytes && bytes.length > 0 && bytes.length <= 6 * 1024 * 1024) {
            const b64 = Buffer.from(bytes).toString("base64");
            resolvedMediaCache.set(lowerKey, { dataUrl: `data:${mimeType};base64,${b64}`, mimeType });
          }
        } catch (e) {
          console.warn(`Aviso ao ler imagem ${lowerKey}:`, e);
        }
      }
    }

    const mediaResolver = (rawFilename: string) => {
      const key = rawFilename.trim();
      const lowerKey = key.toLowerCase();
      const cacheHit = resolvedMediaCache.get(lowerKey) || resolvedMediaCache.get(key);
      if (cacheHit !== undefined) return cacheHit;
      return null;
    };

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 4: INICIALIZAR BANCO SQLITE (SQL.JS WASM)
    // ═══════════════════════════════════════════════════════════════
    const SQL = await getSqlJs();
    let sqliteDb: InstanceType<typeof SQL.Database>;
    try {
      sqliteDb = new SQL.Database(sqliteBuffer);
    } catch (e: any) {
      return NextResponse.json(
        { error: "Falha ao inicializar banco de dados SQLite do APKG: " + e.message },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 5: DETECTAR TABELAS E EXTRAIR DECKS E NOTETYPES
    // ═══════════════════════════════════════════════════════════════
    const existingTables = new Set<string>();
    try {
      const tblStmt = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table'");
      while (tblStmt.step()) {
        const row = tblStmt.getAsObject();
        if (row.name) existingTables.add(String(row.name).toLowerCase());
      }
      tblStmt.free();
    } catch {
      // Ignora
    }

    // 5.1 Extração de Decks
    const ankiDecks: Record<number, AnkiDeck> = {};

    // Tentativa A: tabela `decks` (Anki v14+)
    if (existingTables.has("decks")) {
      try {
        const dStmt = sqliteDb.prepare("SELECT id, name FROM decks");
        while (dStmt.step()) {
          const row = dStmt.getAsObject();
          const dId = Number(row.id);
          const dName = cleanDeckName(String(row.name || "Default"));
          ankiDecks[dId] = { id: dId, name: dName };
        }
        dStmt.free();
      } catch (e) {
        console.warn("Aviso ao ler tabela decks:", e);
      }
    }

    // Tentativa B: coluna `decks` na tabela `col` (Anki v11 / JSON padrão)
    if (Object.keys(ankiDecks).length === 0 && existingTables.has("col")) {
      try {
        const colStmt = sqliteDb.prepare("SELECT decks FROM col LIMIT 1");
        if (colStmt.step()) {
          const decksJson = colStmt.getAsObject().decks as string;
          if (decksJson) {
            const parsed = JSON.parse(decksJson);
            for (const key of Object.keys(parsed)) {
              const d = parsed[key];
              const dId = Number(d.id || key);
              ankiDecks[dId] = {
                id: dId,
                name: cleanDeckName(String(d.name || "Default")),
              };
            }
          }
        }
        colStmt.free();
      } catch (e) {
        console.warn("Aviso ao ler col.decks:", e);
      }
    }

    // 5.2 Extração de Notetypes (Models / Tipos de Nota)
    const models: Record<number, AnkiModel> = {};

    // Tentativa A: tabela `notetypes`
    if (existingTables.has("notetypes")) {
      try {
        const ntStmt = sqliteDb.prepare("SELECT id, name, config FROM notetypes");
        while (ntStmt.step()) {
          const row = ntStmt.getAsObject();
          const mId = Number(row.id);
          const mName = String(row.name || "Standard");
          let mType = 0;
          let flds: AnkiModelField[] = [];
          let tmpls: AnkiModelTemplate[] = [];

          if (row.config) {
            try {
              const conf = typeof row.config === "string" ? JSON.parse(row.config) : row.config;
              mType = conf.kind || 0;
            } catch {}
          }

          models[mId] = { id: mId, name: mName, type: mType, flds, tmpls };
        }
        ntStmt.free();
      } catch (e) {
        console.warn("Aviso ao ler tabela notetypes:", e);
      }
    }

    // Tentativa B: coluna `models` na tabela `col`
    if (Object.keys(models).length === 0 && existingTables.has("col")) {
      try {
        const colStmt = sqliteDb.prepare("SELECT models FROM col LIMIT 1");
        if (colStmt.step()) {
          const modelsJson = colStmt.getAsObject().models as string;
          if (modelsJson) {
            const parsed = JSON.parse(modelsJson);
            for (const key of Object.keys(parsed)) {
              const m = parsed[key];
              const mId = Number(m.id || key);
              const flds: AnkiModelField[] = Array.isArray(m.flds)
                ? m.flds.map((f: any, idx: number) => ({
                    name: String(f.name || `Field${idx}`),
                    ord: Number(f.ord ?? idx),
                  }))
                : [];
              flds.sort((a, b) => a.ord - b.ord);

              const tmpls: AnkiModelTemplate[] = Array.isArray(m.tmpls)
                ? m.tmpls.map((t: any, idx: number) => ({
                    name: String(t.name || `Card ${idx + 1}`),
                    ord: Number(t.ord ?? idx),
                    qfmt: String(t.qfmt || ""),
                    afmt: String(t.afmt || ""),
                  }))
                : [];
              tmpls.sort((a, b) => a.ord - b.ord);

              models[mId] = {
                id: mId,
                name: String(m.name || "Standard"),
                type: Number(m.type || 0),
                flds,
                tmpls,
              };
            }
          }
        }
        colStmt.free();
      } catch (e) {
        console.warn("Aviso ao ler col.models:", e);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 6: LEITURA COMPLETA DE CARDS E NOTES
    // Prioridade: faz JOIN entre cards e notes para garantir que
    // todos os cartões derivados de uma mesma nota (frente/verso,
    // omissões cloze 1, 2, 3...) sejam importados fielmente.
    // ═══════════════════════════════════════════════════════════════
    const processedCards: ProcessedCard[] = [];
    let hasCardsTable = existingTables.has("cards") && existingTables.has("notes");

    if (hasCardsTable) {
      try {
        const query = `
          SELECT c.id as card_id, c.nid, c.did, c.odid, c.ord,
                 c.factor, c.ivl, c.reps, c.lapses, c.due,
                 n.mid, n.flds, n.tags
          FROM cards c
          JOIN notes n ON c.nid = n.id
          ORDER BY c.did, c.id
        `;
        const stmt = sqliteDb.prepare(query);

        while (stmt.step()) {
          const row = stmt.getAsObject();
          const ord = Number(row.ord || 0);
          const mid = Number(row.mid || 0);
          const fldsStr = String(row.flds || "");
          const fields = fldsStr.split("\x1f");

          // Deck de destino: usa odid se estiver em cram/filtered deck, senão did
          const did = Number(row.odid) && Number(row.odid) !== 0 ? Number(row.odid) : Number(row.did || 1);

          const model = models[mid];
          const isCloze = model?.type === 1 || fldsStr.includes("{{c");

          let front = "";
          let back = "";
          let extra = "";
          const extractedImages: string[] = [];

          const cleanWithCollector = (raw: string) => cleanAnkiHtml(raw, mediaResolver, extractedImages);

          if (isCloze) {
            // Renderização Cloze fiel ao ord do card
            const rawText = fields[0] || "";
            const clozeRes = renderClozeCard(rawText, ord, fields, cleanWithCollector);
            front = clozeRes.front;
            back = clozeRes.back;
            extra = clozeRes.extra;
          } else if (model && model.tmpls && model.tmpls.length > 0) {
            // Renderização via Template Oficial do Anki
            const tmpl = model.tmpls.find((t) => t.ord === ord) || model.tmpls[ord] || model.tmpls[0];
            const fieldMap: Record<string, string> = {};
            model.flds.forEach((f, idx) => {
              fieldMap[f.name] = fields[idx] || "";
            });
            fields.forEach((val, idx) => {
              if (!fieldMap[`Field${idx}`]) fieldMap[`Field${idx}`] = val;
            });

            const qfmtEval = evaluateAnkiTemplate(tmpl.qfmt, fieldMap);
            front = cleanWithCollector(qfmtEval);

            // Back template com remoção de duplicidade do FrontSide
            const afmtCleaned = tmpl.afmt.replace(/\{\{FrontSide\}\}\s*(<hr\s*id=["']?answer["']?\/?>)?/gi, "");
            const afmtEval = evaluateAnkiTemplate(afmtCleaned, fieldMap, qfmtEval);
            back = cleanWithCollector(afmtEval);

            // Se o verso ficou vazio por conta do template, usa fallback de campos
            if (!back.trim()) {
              back = cleanWithCollector(fields[1] || fields[0] || "");
            }

            // Campos extras
            if (fields.length > 2) {
              extra = fields.slice(2).map(cleanWithCollector).filter(Boolean).join("\n\n").substring(0, 1500);
            }
          } else {
            // Fallback para modelos sem templates definidos
            if (ord === 0) {
              front = cleanWithCollector(fields[0] || "");
              back = cleanWithCollector(fields[1] || fields[0] || "");
            } else if (ord === 1) {
              front = cleanWithCollector(fields[1] || fields[0] || "");
              back = cleanWithCollector(fields[0] || "");
            } else {
              front = cleanWithCollector(fields[ord] || fields[0] || "");
              back = cleanWithCollector(fields[1] || fields[0] || "");
            }

            if (fields.length > 2) {
              extra = fields.slice(2).map(cleanWithCollector).filter(Boolean).join("\n\n").substring(0, 1500);
            }
          }

          // Validações de conteúdo mínimo
          if (!front.trim() && !back.trim()) continue;
          if (!front.trim()) front = "(Sem pergunta)";
          if (!back.trim()) back = "(Sem resposta)";

          // Estatísticas SRS existentes do Anki
          const reps = Math.max(0, Number(row.reps || 0));
          const lapses = Math.max(0, Number(row.lapses || 0));
          const ivl = Math.max(0, Number(row.ivl || 0));
          const factor = Number(row.factor || 0);
          const easeFactor = factor > 0 ? Number((factor / 1000).toFixed(2)) : 2.5;
          const status = reps > 0 ? "REVIEW" : "NEW";

          // Próxima data de revisão
          let nextReviewDate = new Date();
          if (reps > 0 && ivl > 0) {
            nextReviewDate.setDate(nextReviewDate.getDate() + ivl);
          }

          // Tags associadas à nota no Anki (formato " tag1 tag2 ")
          const rawTags = String(row.tags || "");
          const cardTags = rawTags
            .split(/\s+/)
            .map((t) => t.replace(/^[#_]+/, "").trim())
            .filter((t) => t.length > 0)
            .map((t) => `#${t.toLowerCase()}`);

          const primaryImage = extractedImages[0] || null;

          processedCards.push({
            deckId: did,
            front,
            back,
            extra,
            tags: cardTags,
            imageUrl: primaryImage,
            easeFactor,
            interval: ivl,
            repetitions: reps,
            lapses,
            status,
            nextReviewDate,
          });
        }
        stmt.free();
      } catch (err: any) {
        console.warn("Falha na consulta combinada cards+notes, tentando fallback simples:", err);
        hasCardsTable = false;
      }
    }

    // Fallback: se por algum motivo não conseguiu ler cards, lê diretamente a tabela notes
    if (processedCards.length === 0 && existingTables.has("notes")) {
      try {
        const nStmt = sqliteDb.prepare("SELECT id, mid, flds, tags FROM notes");
        while (nStmt.step()) {
          const row = nStmt.getAsObject();
          const fldsStr = String(row.flds || "");
          const fields = fldsStr.split("\x1f");
          const extractedImages: string[] = [];

          const cleanFn = (raw: string) => cleanAnkiHtml(raw, mediaResolver, extractedImages);

          let front = cleanFn(fields[0] || "");
          let back = cleanFn(fields[1] || fields[0] || "");
          let extra = fields.length > 2 ? fields.slice(2).map(cleanFn).filter(Boolean).join("\n\n").substring(0, 1500) : "";

          if (!front.trim() && !back.trim()) continue;
          if (!front.trim()) front = "(Sem pergunta)";
          if (!back.trim()) back = "(Sem resposta)";

          // Extrai tags da nota
          const rawTags = String(row.tags || "");
          const cardTags = rawTags
            .split(/\s+/)
            .map((t) => t.replace(/^[#_]+/, "").trim())
            .filter((t) => t.length > 0)
            .map((t) => `#${t.toLowerCase()}`);

          processedCards.push({
            deckId: 1,
            front,
            back,
            extra,
            tags: cardTags,
            imageUrl: extractedImages[0] || null,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            lapses: 0,
            status: "NEW",
            nextReviewDate: new Date(),
          });
        }
        nStmt.free();
      } catch (err: any) {
        console.error("Erro fatal ao ler tabela notes:", err);
      }
    }

    sqliteDb.close();

    if (processedCards.length === 0) {
      return NextResponse.json(
        { error: "Nenhum card válido foi encontrado dentro do pacote Anki (.apkg)." },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ETAPA 7: INSERÇÃO NO BANCO DE DADOS (MODO MERGE VS NEW)
    // ═══════════════════════════════════════════════════════════════

    // ── MODO 7A: MERGE (SOMAR A DECK EXISTENTE SEM SUBSTITUIR) ──
    if (mode === "merge" && targetDeckId) {
      // Busca cards já existentes no baralho alvo para não gerar duplicatas exatas
      const existingCards = await db.card.findMany({
        where: { deckId: targetDeckId },
        select: { front: true, back: true },
      });

      const existingPairSet = new Set(
        existingCards.map((c) => `${c.front.trim().toLowerCase()}:::${c.back.trim().toLowerCase()}`)
      );

      const cardsToInsert: any[] = [];
      let skipped = 0;

      for (const card of processedCards) {
        const pairKey = `${card.front.trim().toLowerCase()}:::${card.back.trim().toLowerCase()}`;

        if (existingPairSet.has(pairKey)) {
          skipped++;
          continue;
        }

        existingPairSet.add(pairKey); // Evita duplicatas dentro do próprio lote importado

        const extraWithTags =
          card.tags && card.tags.length > 0 && !card.extra.includes("#")
            ? card.extra
              ? `${card.extra}\n\n${card.tags.join(" ")}`
              : card.tags.join(" ")
            : card.extra;

        cardsToInsert.push({
          deckId: targetDeckId,
          front: card.front,
          back: card.back,
          extra: extraWithTags || "",
          imageUrl: card.imageUrl || null,
          easeFactor: card.easeFactor,
          interval: card.interval,
          repetitions: card.repetitions,
          lapses: card.lapses,
          status: card.status,
          nextReviewDate: card.nextReviewDate,
        });
      }

      // Inserção em lotes de 75 para máxima eficiência no PostgreSQL
      const batchSize = 75;
      for (let i = 0; i < cardsToInsert.length; i += batchSize) {
        const batch = cardsToInsert.slice(i, i + batchSize);
        await db.card.createMany({ data: batch });
      }

      // Atualiza descrição do baralho alvo com as novas tags importadas
      const targetDeck = await db.deck.findUnique({ where: { id: targetDeckId } });
      const importedTags = Array.from(new Set(processedCards.flatMap((c) => c.tags || [])));
      if (targetDeck && importedTags.length > 0) {
        const currentDesc = targetDeck.description || "";
        const missingTags = importedTags.filter((t) => !currentDesc.toLowerCase().includes(t.toLowerCase()));
        if (missingTags.length > 0) {
          const newDesc = `${currentDesc} ${missingTags.slice(0, 6).join(" ")}`.trim();
          await db.deck.update({
            where: { id: targetDeckId },
            data: { description: newDesc },
          });
        }
      }

      return NextResponse.json({
        success: true,
        mode: "merge",
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

    // ── MODO 7B: NEW (CRIAR NOVOS BARALHOS) ──
    // Agrupa cards por deck de origem do Anki
    const cardsByDeckId: Record<number, ProcessedCard[]> = {};
    for (const card of processedCards) {
      if (!cardsByDeckId[card.deckId]) {
        cardsByDeckId[card.deckId] = [];
      }
      cardsByDeckId[card.deckId].push(card);
    }

    const presentDeckIds = Object.keys(cardsByDeckId).map(Number);
    const nonDefaultDeckIds = presentDeckIds.filter((id) => {
      const name = ankiDecks[id]?.name;
      return name && name.toLowerCase() !== "default";
    });

    const fileBaseName = file.name.replace(/\.apkg$/i, "").replace(/[_-]/g, " ").trim();

    const deckResults: { id: string; title: string; importedCards: number; skippedDuplicates: number }[] = [];
    let totalImported = 0;
    let totalSkipped = 0;

    for (const dId of presentDeckIds) {
      const deckCards = cardsByDeckId[dId];
      if (!deckCards || deckCards.length === 0) continue;

      let deckTitle = "";
      if (nonDefaultDeckIds.length === 0) {
        // Se todos os cards estavam no deck "Default", usa o nome do arquivo .apkg
        deckTitle = fileBaseName || "Baralho Importado";
      } else if (ankiDecks[dId]) {
        deckTitle = ankiDecks[dId].name;
        // Pula o deck Default vazio ou residual se existirem outros decks com nomes reais
        if (deckTitle.toLowerCase() === "default" && nonDefaultDeckIds.length > 0) {
          continue;
        }
      } else {
        deckTitle = `${fileBaseName} (Parte ${dId})`;
      }

      // Extrai tags únicas do lote deste baralho
      const uniqueTagsInDeck = Array.from(new Set(deckCards.flatMap((c) => c.tags || [])));
      const tagSuffix = uniqueTagsInDeck.length > 0 ? ` • ${uniqueTagsInDeck.slice(0, 8).join(" ")}` : "";
      const deckDescription = `Importado de pacote Anki (${deckCards.length} cards)${tagSuffix}`;

      // Cria o novo Deck
      const newDeck = await db.deck.create({
        data: {
          title: deckTitle,
          description: deckDescription,
          icon: getDeckIcon(deckTitle),
          color: "#10b981",
        },
      });

      // Deduplicação interna
      const seenPairSet = new Set<string>();
      const cardsToInsert: any[] = [];
      let skippedInDeck = 0;

      for (const card of deckCards) {
        const pairKey = `${card.front.trim().toLowerCase()}:::${card.back.trim().toLowerCase()}`;
        if (seenPairSet.has(pairKey)) {
          skippedInDeck++;
          continue;
        }
        seenPairSet.add(pairKey);

        const extraWithTags =
          card.tags && card.tags.length > 0 && !card.extra.includes("#")
            ? card.extra
              ? `${card.extra}\n\n${card.tags.join(" ")}`
              : card.tags.join(" ")
            : card.extra;

        cardsToInsert.push({
          deckId: newDeck.id,
          front: card.front,
          back: card.back,
          extra: extraWithTags || "",
          imageUrl: card.imageUrl || null,
          easeFactor: card.easeFactor,
          interval: card.interval,
          repetitions: card.repetitions,
          lapses: card.lapses,
          status: card.status,
          nextReviewDate: card.nextReviewDate,
        });
      }

      // Inserção em lotes
      const batchSize = 75;
      for (let i = 0; i < cardsToInsert.length; i += batchSize) {
        const batch = cardsToInsert.slice(i, i + batchSize);
        await db.card.createMany({ data: batch });
      }

      deckResults.push({
        id: newDeck.id,
        title: deckTitle,
        importedCards: cardsToInsert.length,
        skippedDuplicates: skippedInDeck,
      });

      totalImported += cardsToInsert.length;
      totalSkipped += skippedInDeck;
    }

    return NextResponse.json({
      success: true,
      mode: "new",
      decks: deckResults,
      totalImported,
      totalSkipped,
    });
  } catch (error: any) {
    console.error("Erro na importação APKG:", error);
    return NextResponse.json(
      { error: "Erro ao importar pacote Anki: " + (error?.message || error) },
      { status: 500 }
    );
  }
}
