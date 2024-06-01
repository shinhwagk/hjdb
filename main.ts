import { existsSync } from "https://deno.land/std/fs/mod.ts";

class JDB {
  private readonly dbcache: Map<string, any> = new Map();
  private readonly dbcache_cnt: Map<string, number> = new Map();

  public query(db: string) {
    if (this.dbcache.has(db)) {
      return this.dbcache.get(db);
    } else {
      if (existsSync(`${db}.json`)) {
        const dbcache = JSON.parse(Deno.readTextFileSync(`${db}.json`));
        this.dbcache.set(db, dbcache);
        return dbcache;
      } else {
        return {};
      }
    }
  }

  public update(db: string, content: any) {
    this.dbcache.set(db, content);
    const cnt = this.dbcache_cnt.has(db) ? this.dbcache_cnt.get(db)! : 0;
    this.dbcache_cnt.set(db, cnt + 1);
    this.checkpoint(db);
  }

  private checkpoint(db: string) {
    if (this.dbcache_cnt.get(db)! % 10 == 0) {
      Deno.writeTextFileSync(
        `${db}.json`,
        JSON.stringify(this.dbcache.get(db)),
      );
    }
  }
}

const jdb = new JDB();

async function serveHandler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const headers = new Headers({ "Content-Type": "application/json" });

  let errmsg = "";
  if (pathname.startsWith("/db/")) {
    const dbname = pathname.substring(4);
    if (dbname.length == 0) {
      errmsg = "db name is emty.";
    }
    if (request.method === "GET") {
      const responseObj = { state: "ok", db: dbname, data: jdb.query(dbname) };
      return new Response(JSON.stringify(responseObj), { headers });
    } else if (request.method === "POST") {
      jdb.update(dbname, await request.json());
      const responseObj = { state: "ok" };
      return new Response(JSON.stringify(responseObj), { headers });
    } else {
      errmsg = "unknow";
    }
  }

  return new Response(JSON.stringify({ state: "err", message: errmsg }), {
    headers,
    status: 200,
  });
}

Deno.serve(serveHandler);
