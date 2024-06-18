import * as http from 'http';

import { MemDB } from "./memdb";
import { FileDB } from "./filedb";
import { Metric } from "./metric";


import { ResponseData } from "./types"
import { HJDBError, HJDBErrorCode } from "./error"
import { validateName } from "./helper"

function sendResp(res: http.ServerResponse, payload: ResponseData) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(res: http.ServerResponse, e: unknown): void {
  metric.inc('query', store, db, tab, 1);

  if (e instanceof HJDBError) {
    return sendResp(res, { state: 'err', errmsg: e.message, errcode: e.errorCode });
  } else if (e instanceof Error) {
    return sendResp(res, { state: 'err', errmsg: e.message });
  } else {
    return sendResp(res, { state: 'err', errmsg: 'Internal server error' });
  }
}

function readReqBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((res, _) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { res(body); });
  })
}

const filedb = new FileDB('/var/lib/hjdb');
const memdb = new MemDB();
const metric = new Metric();

const handleMetric = async (res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(metric.metrics());
}

const handleHJDB = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const parts = req.url?.split('/').filter(p => p);
  if (!parts) return sendResp(res, { state: 'err', errmsg: 'Invalid request' });

  const storeType = parts[0] as "file" | "memory";
  if (!["file", "memory"].includes(storeType)) {
    return sendError(res, new Error('Invalid store type'));
  }
  const dbms = storeType === "file" ? filedb : memdb;

  try {
    if (parts.length === 1) {
      return sendResp(res, { state: 'ok', data: dbms.getDbs() });
    } else if (parts.length >= 2) {
      const dbName = parts[1];
      if (!validateName(dbName)) {
        return sendError(res, HJDBError.new(HJDBErrorCode.HJDB003));
      }

      if (parts.length === 2) {
        const tabs = dbms.getTabs(dbName);
        return sendResp(res, { state: 'ok', data: tabs });
      } else if (parts.length === 3) {
        const tableName = parts[2];
        if (!validateName(tableName)) {
          return sendError(res, HJDBError.new(HJDBErrorCode.HJDB004));
        }
        return await handleTableOperations(req, res, dbms, storeType, dbName, tableName);
      }
    }
  } catch (e) {
    return sendError(res, e);
  }
}

async function handleTableOperations(req: http.IncomingMessage, res: http.ServerResponse, dbms: MemDB, store: 'file' | "memory", db: string, tab: string) {
  switch (req.method) {
    case 'GET':
      const queryResult = dbms.query(db, tab);
      if (queryResult) {
        metric.inc('query', store, db, tab, 1);
        return sendResp(res, { state: 'ok', ...queryResult });
      } else {
        return sendError(res, HJDBError.new(HJDBErrorCode.HJDB001));
      }
    case 'POST':
      const data = await readReqBody(req);
      dbms.update(db, tab, JSON.parse(data));
      metric.inc('update', store, db, tab, 1);
      return sendResp(res, { state: 'ok' });
    case 'DELETE':
      dbms.delete(db, tab);
      metric.inc('delete', store, db, tab, 1);
      return sendResp(res, { state: 'ok' });
    default:
      return sendError(res, new Error('Method Not Allowed'));
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
  console.log('Server running on http://localhost:8000');
});
