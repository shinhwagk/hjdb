import * as http from 'http';

import { MemDB } from "./memdb";
import { FileDB } from "./filedb";
import { Metric } from "./metric";

import { ResponseData, DBStore, IDB } from "./types"
import { HJDBError } from "./error"

function sendResp(res: http.ServerResponse, payload: ResponseData) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(res: http.ServerResponse, e: unknown): void {
  metric.incErr();

  if (e instanceof HJDBError) {
    return sendResp(res, { state: 'err', errmsg: e.message, errcode: e.errorCode });
  } else if (e instanceof Error) {
    return sendResp(res, { state: 'err', errmsg: e.message });
  } else {
    return sendResp(res, { state: 'err', errmsg: 'Internal server error' });
  }
}

function readReqBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { res(body); });
  })
}

const filedb: IDB = new FileDB('/var/lib/hjdb');
const memdb = new MemDB();
const metric = new Metric();

const handleMetric = async (res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(metric.metrics());
}

const handleHJDB = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const parts = req.url?.split('/').filter(p => p);
  if (!parts) return sendError(res, new Error('Invalid request'));

  const storeType = parts[0] as DBStore;
  if (!["file", "memory"].includes(storeType)) {
    return sendError(res, new Error('Invalid store type'));
  }
  const dbms = storeType === "file" ? filedb : memdb;
  try {
    if (parts.length === 1 && req.method === "GET") {
      return sendResp(res, { state: 'ok', data: dbms.getDbs() });
    } else if (parts.length == 2 && req.method === "GET") {
      const db = parts[1];
      const schs = dbms.getSchs(db);
      return sendResp(res, { state: 'ok', data: schs });
    } else if (parts.length === 3) {
      const db = parts[1], sch = parts[2];
      const tabs = dbms.getTabs(db, sch)
      return sendResp(res, { state: 'ok', data: tabs });
    } else if (parts.length === 4) {
      const db = parts[1], sch = parts[2], tab = parts[3];
      return await handleTableOperations(req, res, dbms, db, sch, tab);
    }
  } catch (e) {
    return sendError(res, e);
  }
}

async function handleTableOperations(req: http.IncomingMessage, res: http.ServerResponse, dbms: IDB, db: string, sch: string, tab: string) {
  try {
    switch (req.method) {
      case 'GET':
        sendResp(res, { state: 'ok', data: dbms.query(db, sch, tab) });
        metric.inc('query', dbms.getStore(), db, sch, tab, 1);
        return
      case 'POST':
        const data = JSON.parse(await readReqBody(req));
        dbms.update(db, sch, tab, data);
        sendResp(res, { state: 'ok' });
        return metric.inc('update', dbms.getStore(), db, sch, tab, 1);
      case 'DELETE':
        dbms.delete(db, sch, tab);
        sendResp(res, { state: 'ok' });
        return metric.inc('delete', dbms.getStore(), db, sch, tab, 1);
      default:
        new Error('Method Not Allowed');
    }
  } catch (e) {
    return sendError(res, e);
  }
}


const handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (!req.url || !req.method) {
    return sendError(res, new Error('Bad request'))
  }

  if (req.url === '/metrics') {
    return handleMetric(res);
  } else if (req.url.startsWith('/file') || req.url.startsWith('/memory')) {
    return handleHJDB(req, res);
  } else {
    return sendError(res, new Error('Not found'))
  }
}

http.createServer(handleRequest).listen(8000, () => {
  console.log('Server running on http://:8000');
});


const server = Bun.serve({
  port: 3000,
  fetch(request) {
    return new Response("Welcome to Bun!");
  },
});
