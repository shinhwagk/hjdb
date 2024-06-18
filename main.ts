import * as http from 'http';

import { MemDB } from "./memdb";
import { FileDB } from "./filedb";
import { Metric } from "./metric";


import { ResponseData, DBStore } from "./types"
import { HJDBError, HJDBErrorCode, HJDBErrorMsg } from "./error"
import { validateName } from "./helper"



function sendResp(res: http.ServerResponse, payload: ResponseData) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(res: http.ServerResponse, e: unknown): void {
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

  if (parts?.length === 1) {
    const dbms = parts[0] === "file" ? filedb : memdb;
    return sendResp(res, { state: 'ok', data: dbms.getDbs() });
  } else if (parts?.length === 2) {
    const db = parts[1]
    if (!validateName(db)) { return sendError(res, HJDBError.new(HJDBErrorCode.HJDB003)) }

    const dbms = parts[0] === "file" ? filedb : memdb;

    try {
      const tabs = dbms.getTabs(db)
      return sendResp(res, { state: 'ok', data: tabs });
    } catch (e) {
      return sendError(res, e)
    }
  } else if (parts?.length === 3) {
    const [store, db, tab] = parts as [DBStore, string, string];
    if (!validateName(db)) { return sendError(res, HJDBError.new(HJDBErrorCode.HJDB003)) }
    if (!validateName(tab)) { return sendError(res, HJDBError.new(HJDBErrorCode.HJDB004)) }

    if (!["file", "memory"].includes(store)) {
      return sendError(res, new Error('Invalid store type'))
    }

    const dbms = store === "file" ? filedb : memdb;

    try {
      switch (req.method) {
        case 'GET':
          const sf = dbms.query(db, tab)
          if (sf) {
            sendResp(res, { state: 'ok', ...sf });
            return metric.inc('query', store as DBStore, db, tab, 1)
          } else {
            return sendError(res, HJDBError.new(HJDBErrorCode.HJDB001));
          }
        case 'POST':
          const data = await readReqBody(req)
          dbms.update(db, tab, JSON.parse(data));
          metric.inc('update', store, db, tab, 1)
          return sendResp(res, { state: 'ok' });
        case 'DELETE':
          dbms.delete(db, tab);
          metric.inc('delete', store, db, tab, 1)
          return sendResp(res, { state: 'ok' });
        default:
          return sendError(res, new Error('Method Not Allowed'));
      }
    } catch (e) {
      return sendError(res, e);
    }
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
