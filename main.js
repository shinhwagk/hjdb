// @ts-check

const http = require('http');

const MemDB = require('./memdb');
const FileDB = require('./filedb');
const PromMetric = require('./metric');


/**
 * @typedef {import('./types').ResponseData} ResponseData
 */

/**
 * @param {http.ServerResponse} res 
 * @param {ResponseData} payload 
 */
function sendResp(res, payload) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

/**
 * @param {http.IncomingMessage} req 
 * @returns {Promise<string>}
 */
function readReqBody(req) {
  return new Promise((res, _) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { res(body); });
  })
}

const filedb = new FileDB('/var/lib/hjdb');
const memdb = new MemDB();

const metric = new PromMetric();


/**
 * @param {http.ServerResponse} res 
 */
const handleMetric = async (res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(metric.metrics());
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
const handleHJDB = async (req, res) => {
  const parts = req.url?.split('/').filter(p => p);
  if (parts === undefined || parts.length !== 3) {
    return sendResp(res, { state: 'err', errmsg: 'Invalid URL path' });
  }

  const [store, db, tab] = parts;
  if (!["file", "memory"].includes(store)) {
    return sendResp(res, { state: 'err', errmsg: 'Invalid store type' });
  }

  const dbms = store === "file" ? filedb : memdb;

  try {
    switch (req.method) {
      case 'GET':
        const sf = dbms.query(db, tab)
        if (sf) {
          sendResp(res, { state: 'ok', ...sf });
          // @ts-ignore
          metric.inc('query', store, db, tab, 1)
          return
        } else {
          return sendResp(res, { state: 'err', errmsg: "table not exist.", errcode: 'hjdb-001' });
        }
      case 'POST':
        const data = await readReqBody(req)
        dbms.update(db, tab, JSON.parse(data));
        // @ts-ignore
        metric.inc('update', store, db, tab, 1)
        return sendResp(res, { state: 'ok' });
      case 'DELETE':
        dbms.delete(db, tab);
        // @ts-ignore
        metric.inc('delete', store, db, tab, 1)
        return sendResp(res, { state: 'ok' });
      default:
        return sendResp(res, { state: 'err', errmsg: 'Method Not Allowed' });
    }
  } catch (e) {
    return sendResp(res, { state: 'err', errmsg: `${e}` });
  }
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
const handleRequest = async (req, res) => {
  if (!req.url || !req.method) {
    return sendResp(res, { state: 'err', errmsg: 'Bad request' });
  }

  if (req.url === '/metrics') {
    return handleMetric(res);
  } else if (req.url.startsWith('/file/') || req.url.startsWith('/memory/')) {
    return handleHJDB(req, res);
  } else {
    sendResp(res, { state: 'err', errmsg: 'Not found' });
  }

}

http.createServer(handleRequest).listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
