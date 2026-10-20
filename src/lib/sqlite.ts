import initSqlJs, { SqlJsStatic } from "sql.js";
import fs from "fs";
import path from "path";

// Cache em memória da instância SQL.js inicializada para reutilização rápida
let cachedSqlInstance: SqlJsStatic | null = null;
let initPromise: Promise<SqlJsStatic> | null = null;

/**
 * Retorna uma instância inicializada do SQL.js (SQLite WebAssembly).
 * 
 * Funciona de forma transparente tanto em desenvolvimento local quanto em
 * ambientes serverless (Vercel, AWS Lambda, Docker) através de um mecanismo
 * resiliente de 3 camadas:
 * 1. Arquivo local no node_modules ou na pasta public/
 * 2. Fallback via CDN oficial (sql.js.org / unpkg) caso o container serverless não tenha o .wasm
 * 3. Injeção direta de `wasmBinary` no `initSqlJs`, evitando qualquer erro de ENOENT do Emscripten.
 */
export async function getSqlJs(): Promise<SqlJsStatic> {
  if (cachedSqlInstance) {
    return cachedSqlInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    let wasmBinary: ArrayBuffer | Uint8Array | undefined;

    // Camada 1: Busca no sistema de arquivos local
    const localCandidates = [
      path.join(process.cwd(), "public", "sql-wasm.wasm"),
      path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    ];

    for (const candidate of localCandidates) {
      try {
        if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
          wasmBinary = fs.readFileSync(/*turbopackIgnore: true*/ candidate);
          break;
        }
      } catch {
        // Ignora e tenta o próximo candidato
      }
    }

    // Camada 2: Se não encontrado localmente (ex: ambiente serverless da Vercel sem o binário),
    // busca o binário diretamente via CDN com retry em múltiplos provedores
    if (!wasmBinary) {
      const cdnUrls = [
        "https://sql.js.org/dist/sql-wasm.wasm",
        "https://unpkg.com/sql.js@1.14.2/dist/sql-wasm.wasm",
        "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm",
      ];

      for (const url of cdnUrls) {
        try {
          const res = await fetch(url, { cache: "force-cache" });
          if (res.ok) {
            wasmBinary = await res.arrayBuffer();
            break;
          }
        } catch {
          // Tenta próximo CDN
        }
      }
    }

    // Inicializa o SQL.js com o buffer binário em memória (100% livre de ENOENT)
    const sql = wasmBinary
      ? await initSqlJs({ wasmBinary: wasmBinary as any })
      : await initSqlJs();

    cachedSqlInstance = sql;
    return sql;
  })();

  return initPromise;
}
