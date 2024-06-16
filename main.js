// @ts-check

const http = require('http');

const MemDB = require('./memdb');
const FileDB = require('./filedb');
const Metric = require('./metric');


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

const metric = new Metric();


/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
const handleMetric = async (req, res) => {
  memdb.dbCache
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
const handleHJDB = async (req, res) => {
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
const handleRequest = async (req, res) => {
  if (!req.url || !req.method) {
    return sendResp(res, { state: 'err', err: 'Bad request' });
  }

  const parts = req.url.split('/').filter(p => p);
  if (parts.length !== 3) {
    return sendResp(res, { state: 'err', err: 'Invalid URL path' });
  }

  const [store, db, tab] = parts;
  if (!["file", "memory"].includes(store)) {
    return sendResp(res, { state: 'err', err: 'Invalid store type' });
  }

  const dbms = store === "file" ? filedb : memdb;

  try {
    switch (req.method) {
      case 'GET':
        const sf = dbms.query(db, tab)
        if (sf) {
          sendResp(res, { state: 'ok', ...sf });
          metric.inc('query', db, tab, 1)
          return
        } else {
          return sendResp(res, { state: 'err', err: "table not exist." });
        }
      case 'POST':
        const data = await readReqBody(req)
        dbms.update(db, tab, JSON.parse(data));
        metric.inc('update', db, tab, 1)
        return sendResp(res, { state: 'ok' });
      case 'DELETE':
        dbms.delete(db, tab);
        metric.inc('delete', db, tab, 1)
        return sendResp(res, { state: 'ok' });
      default:
        return sendResp(res, { state: 'err', err: 'Method Not Allowed' });
    }
  } catch (e) {
    return sendResp(res, { state: 'err', err: `${e}` });
  }
}

http.createServer(handleRequest).listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
