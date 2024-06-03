import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";

class HJDB {
  private readonly dbCache: Map<string, object> = new Map();
  private readonly dbCachePin: Set<string> = new Set();

  constructor() {
    this.checkpoint();
  }

  public query(db: string, tab: string) {
    const dbtabpath = `/data/${db}/${tab}.json`;

    if (this.dbCache.has(dbtabpath)) {
      return this.dbCache.get(dbtabpath);
    }

    if (existsSync(dbtabpath)) {
      const dbcache = JSON.parse(Deno.readTextFileSync(dbtabpath));
      this.dbCache.set(dbtabpath, dbcache);
      return dbcache;
    }

    return {};
  }

  public delete(db: string, tab: string) {
    this.dbCache.delete(db);
    Deno.removeSync(`/data/${db}/${tab}.json`);
  }

  public update(db: string, tab: string, content: object) {
    if (!existsSync(`/data/${db}`)) {
      Deno.mkdirSync(`/data/${db}`);
    }
    this.dbCache.set(`/data/${db}/${tab}.json`, content);
    this.dbCachePin.add(`/data/${db}/${tab}.json`);
  }

  private async checkpoint() {
    while (true) {
      for (const dbtabpath of this.dbCachePin.values()) {
        const data = JSON.stringify(this.dbCache.get(dbtabpath));
        await Deno.writeTextFile(
          dbtabpath,
          data,
        );
        console.log(
          `${
            new Date().toLocaleString()
          } checkpoint dbtab:' ${dbtabpath}' data: '${data}'`,
        );
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
  tab: string | null;
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

  const parts = pathname.split("/");

  if (
    parts.length == 5 &&
    parts[1] == "db" &&
    parts[3] == "tab" &&
    parts[2].length >= 1 &&
    parts[4].length >= 1
  ) {
    const dbname = parts[2];
    const tabname = parts[4];

    try {
      if (request.method === "GET") {
        return jsonResponse({
          state: "ok",
          db: dbname,
          tab: tabname,
          data: hjdb.query(dbname, tabname),
          err: null,
        });
      } else if (request.method === "POST") {
        hjdb.update(dbname, tabname, await request.json());
        return jsonResponse({
          state: "ok",
          db: dbname,
          tab: tabname,
          err: null,
          data: null,
        });
      } else if (request.method === "DELETE") {
        hjdb.delete(dbname, tabname);
        return jsonResponse({
          state: "ok",
          db: dbname,
          tab: tabname,
          err: null,
          data: null,
        });
      }
    } catch (err) {
      return jsonResponse({
        state: "err",
        data: null,
        db: dbname,
        tab: tabname,
        err: "Error processing request: " + err.message,
      });
    }
  }

  return jsonResponse({
    state: "err",
    err: "Unknown error.",
    db: null,
    tab: null,
    data: null,
  });
}

Deno.serve({ port: 8000 }, serveHandler);
