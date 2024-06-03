import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";

class HJDB {
  private readonly dbCache: Map<string, object> = new Map();
  private readonly dbCachePin: Set<string> = new Set();

  constructor() {
    this.checkpoint();
  }

  public query(db: string) {
    if (this.dbCache.has(db)) {
      return this.dbCache.get(db);
    }

    const dbPath = `/data/${db}.json`;

    if (existsSync(dbPath)) {
      const dbcache = JSON.parse(Deno.readTextFileSync(dbPath));
      this.dbCache.set(db, dbcache);
      return dbcache;
    }

    return {};
  }

  public delete(db: string) {
    this.dbCache.delete(db);
    Deno.removeSync(`/data/${db}.json`);
  }

  public update(db: string, content: object) {
    this.dbCache.set(db, content);
    this.dbCachePin.add(db);
  }

  private async checkpoint() {
    while (true) {
      for (const db of this.dbCachePin.values()) {
        const dbPath = `/data/${db}.json`;
        await Deno.writeTextFile(
          dbPath,
          JSON.stringify(this.dbCache.get(db)),
        );
        console.log(`${new Date().toLocaleString()} checkpoint db ${db}`);
      }
      this.dbCachePin.clear();
      await new Promise((f) => setTimeout(f, 1000));
    }
  }
}

const hjdb = new HJDB();

interface jsonResponseData {
  state: "ok" | "err";
  data: object | null;
  db: string | null;
  err: string | null;
}

function jsonResponse(body: jsonResponseData): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function serveHandler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/db/")) {
    const dbname = pathname.substring(4);

    try {
      if (request.method === "GET") {
        return jsonResponse({
          state: "ok",
          db: dbname,
          data: hjdb.query(dbname),
          err: null,
        });
      } else if (request.method === "POST") {
        hjdb.update(dbname, await request.json());
        return jsonResponse({ state: "ok", db: dbname, err: null, data: null });
      } else if (request.method === "DELETE") {
        hjdb.delete(dbname);
        return jsonResponse({ state: "ok", db: dbname, err: null, data: null });
      }
    } catch (err) {
      return jsonResponse({
        state: "err",
        data: null,
        db: dbname,
        err: "Error processing request: " + err.message,
      });
    }
  }

  return jsonResponse({
    state: "err",
    err: "Unknown error.",
    db: null,
    data: null,
  });
}

Deno.serve({ port: 8000 }, serveHandler);
