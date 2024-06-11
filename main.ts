import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";

class FileDB {
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

    return null;
  }

  public delete(db: string, tab: string) {
    this.dbCache.delete(db);
    Deno.removeSync(`/data/${db}/${tab}.json`);
  }

  public update(db: string, tab: string, content: object) {
    this.dbCache.set(`/data/${db}/${tab}.json`, content);
    this.dbCachePin.add(`/data/${db}/${tab}.json`);
  }

  private async checkpoint() {
    while (true) {
      for (const dbtabpath of this.dbCachePin.values()) {
        const data = JSON.stringify(this.dbCache.get(dbtabpath));

        const parts = dbtabpath.split("/");

        if (!existsSync(`/data/${parts[2]}`)) {
          console.log("create directory " + `/data/${parts[2]}`);
          Deno.mkdirSync(`/data/${parts[2]}`);
        }

        await Deno.writeTextFile(
          dbtabpath,
          data,
        );
        console.log(
          `${
            new Date().toLocaleString()
          } checkpoint storge:'file', dbtab:' ${dbtabpath}' content: '${
            JSON.stringify(data)
          }'`,
        );
      }
      this.dbCachePin.clear();
      await new Promise((f) => setTimeout(f, 1000));
    }
  }
}

class MemDB {
  private readonly dbCache: Map<string, object> = new Map();
  private readonly dbCachePin: Set<string> = new Set();

  public query(db: string, tab: string) {
    const dbtabpath = `${db}@${tab}`;

    if (this.dbCache.has(dbtabpath)) {
      return this.dbCache.get(dbtabpath);
    }

    return null;
  }

  public update(db: string, tab: string, content: object) {
    this.dbCache.set(`${db}@${tab}`, content);
    this.dbCachePin.add(`${db}@${tab}`);
    console.log(
      `${
        new Date().toLocaleString()
      } checkpoint storge:'memory', db:'${db}', tab:'${tab}' content: '${
        JSON.stringify(content)
      }'`,
    );
  }

  public delete(db: string, tab: string) {
    this.dbCache.delete(`${db}@${tab}`);
  }
}

const filedb = new FileDB();
const memdb = new MemDB();

interface jsonResponseData {
  state: "ok" | "err";
  data: object | null;
  db: string | null;
  tab: string | null;
  err: string | null;
  store: "file" | "memory" | null;
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

  // /db/dbname/tab/tabname/store/file
  if (
    parts.length == 7 &&
    parts[1] == "db" &&
    parts[3] == "tab" &&
    parts[5] == "store" &&
    parts[2].length >= 1 &&
    parts[4].length >= 1 &&
    ["file", "memory"].includes(parts[6])
  ) {
    const db = parts[2];
    const tab = parts[4];
    const store = parts[6] as "file" | "memory";

    const dbms = parts[4] === "file" ? filedb : memdb;

    try {
      if (request.method === "GET") {
        return jsonResponse({
          state: "ok",
          db: db,
          tab: tab,
          data: dbms.query(db, tab),
          err: null,
          store: store,
        });
      } else if (request.method === "POST") {
        dbms.update(db, tab, await request.json());

        return jsonResponse({
          state: "ok",
          db: db,
          tab: tab,
          err: null,
          data: null,
          store: store,
        });
      } else if (request.method === "DELETE") {
        dbms.delete(db, tab);
        return jsonResponse({
          state: "ok",
          db: db,
          tab: tab,
          err: null,
          data: null,
          store: store,
        });
      }
    } catch (err) {
      return jsonResponse({
        state: "err",
        data: null,
        db: db,
        tab: tab,
        err: "Error processing request: " + err.message,
        store: store,
      });
    }
  }

  return jsonResponse({
    state: "err",
    err: "Unknown error.",
    db: null,
    tab: null,
    data: null,
    store: null,
  });
}

Deno.serve({ port: 8000 }, serveHandler);
