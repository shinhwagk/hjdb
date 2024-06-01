import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";

class HJDB {
  private readonly dbCache: Map<string, object> = new Map();
  private readonly dbCacheCount: Map<string, number> = new Map();

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

  public update(db: string, content: object) {
    this.dbCache.set(db, content);
    const cnt = (this.dbCacheCount.get(db) || 0) + 1;
    this.dbCacheCount.set(db, cnt);

    if (cnt % 10 == 0) {
      this.checkpoint(db).then(() =>
        console.log(`db:${db} checkpoint complate.`)
      );
    }
  }

  private async checkpoint(db: string) {
    const dbPath = `/data/${db}.json`;
    await Deno.writeTextFile(
      dbPath,
      JSON.stringify(this.dbCache.get(db)),
    );
  }
}

const hjdb = new HJDB();

function jsonResponse(body: object) {
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
        });
      } else if (request.method === "POST") {
        hjdb.update(dbname, await request.json());
        return jsonResponse({ state: "ok" });
      }
    } catch (err) {
      return jsonResponse({
        state: "err",
        message: "Error processing request: " + err.message,
      });
    }
  }

  return jsonResponse({ state: "err", message: "Unknown error." });
}

Deno.serve({ port: 8000 }, serveHandler);
