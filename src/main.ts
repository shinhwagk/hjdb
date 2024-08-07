import { MemDB } from "./memdb";
import { FileDB } from "./filedb";
import { Metric } from "./metric";
import { ResponseData, DBStore, IDB } from "./types"
import { HJDBError } from "./error"

const filedb: FileDB = new FileDB('/var/lib/hjdb');
const memdb = new MemDB();
const promMetric = new Metric();

function sendResp(payload: ResponseData) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function sendError(e: unknown): Response {
  promMetric.incErr();
  if (e instanceof HJDBError) {
    return sendResp({ state: 'err', errmsg: e.message, errcode: e.errorCode });
  } else if (e instanceof Error) {
    return sendResp({ state: 'err', errmsg: e.message });
  } else {
    return sendResp({ state: 'err', errmsg: 'Internal server error' });
  }
}

const handleMetric = (): Response => {
  const stream = new ReadableStream({
    start: (controller) => {
      try {
        for (const metric of promMetric.metrics()) {
          controller.enqueue(metric + "\n");
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/plain' } });
};

const handleHJDB = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  const parts = url.pathname.split('/').filter(p => p.length !== 0);
  if (!parts) return sendError(new Error('Invalid request'));

  const method = req.method

  const storeType = parts[0] as DBStore;
  const dbms = storeType === "file" ? filedb : memdb;
  try {
    if (parts.length === 1 && method === "GET") {
      return sendResp({ state: 'ok', data: dbms.getDbs() });
    } else if (parts.length == 2 && method === "GET") {
      const db = parts[1];
      const schs = dbms.getSchs(db);
      return sendResp({ state: 'ok', data: schs });
    } else if (parts.length === 3 && method == "GET") {
      const db = parts[1], sch = parts[2];
      const tabs = dbms.getTabs(db, sch)
      return sendResp({ state: 'ok', data: tabs });
    } else if (parts.length === 4) {
      const db = parts[1], sch = parts[2], tab = parts[3];
      return await handleTableOperations(req, dbms, db, sch, tab);
    } else {
      return sendError(new Error('Invalid request'));
    }
  } catch (e) {
    return sendError(e);
  }
}

async function handleTableOperations(req: Request, dbms: IDB, db: string, sch: string, tab: string): Promise<Response> {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.search);

  try {
    if (req.method == "GET") {
      const resp = sendResp({ state: 'ok', data: dbms.query(db, sch, tab) });
      promMetric.inc('query', dbms.getStore(), db, sch, tab, 1);
      return resp
    } else if (req.method == "POST") {
      const data = await (await req.blob()).json();
      dbms.update(db, sch, tab, data);
      if (searchParams.get("asynccommit") === "false" && dbms instanceof FileDB) {
        await dbms.checkpoint();
      }
      const resp = sendResp({ state: 'ok' });
      promMetric.inc('update', dbms.getStore(), db, sch, tab, 1);
      return resp
    } else if (req.method == "DELETE") {
      await dbms.delete(db, sch, tab);
      if (searchParams.get("asynccommit") === "false" && dbms instanceof FileDB) {
        await dbms.checkpoint();
      }
      const resp = sendResp({ state: 'ok' });
      promMetric.inc('delete', dbms.getStore(), db, sch, tab, 1);
      return resp
    } else {
      return sendError(new Error('Method Not Allowed'))
    }
  } catch (e) {
    return sendError(e);
  }
}

const handleRequest = async (req: Request): Promise<Response> => {
  const pathname = (new URL(req.url)).pathname;

  if (pathname === '/metrics') {
    return handleMetric();
  } else if (pathname.startsWith('/file/') || ['/file', '/memory'].includes(pathname) || pathname.startsWith('/memory/')) {
    return handleHJDB(req);
  } else {
    return sendError(new Error('urls: /metrics, /file, /memory'))
  }
}

async function main() {
  await filedb.loadData()

  const server = Bun.serve({
    fetch(request) {
      return handleRequest(request)
    },
  });
  console.log(`HJDB Running On http://:${server.url.port}`);
}

main()