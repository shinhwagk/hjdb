// @ts-check

const fs = require('fs');
const path = require('path');

const MemDB = require('./memdb');

/**
 * @typedef {import('./types').StoreFormat} StoreFormat
 */

class FileDB extends MemDB {
  /** @type {Set<string>} */
  dbCachePin = new Set()
  dbDir;

  /**
   * @param {string} dbDir;
   */
  constructor(dbDir) {
    super();
    this.dbDir = dbDir;
    this.loadData();
    this.checkpoint();
  }

  /**
   * @param {string} db;
   * @param {string} tab;
   * @returns {StoreFormat | null}
   */
  query(db, tab) {
    return super.query(db, tab);
  }

  /**
   * @param {string} db;
   * @param {string} tab;
   */
  delete(db, tab) {
    super.delete(db, tab);
    fs.unlinkSync(path.join(this.dbDir, db, `${tab}.json`));
  }

  /**
   * @param {string} db
   * @param {string} tab
   * @param {object} data
   */
  update(db, tab, data) {
    super.update(db, tab, data);
    this.dbCachePin.add(`${db}@${tab}`);
  }

  /**
   * @returns { Promise<void>}
   */
  async checkpoint() {
    while (true) {
      for (const dbtabpath of this.dbCachePin) {
        const data = JSON.stringify(this.dbCache.get(dbtabpath));
        if (!fs.existsSync(path.dirname(dbtabpath))) {
          fs.mkdirSync(path.dirname(dbtabpath), { recursive: true });
        }
        console.log(dbtabpath, data)
        fs.writeFileSync(dbtabpath, data, { encoding: 'utf-8' });
        console.log(`${new Date().toLocaleString()} checkpoint storage:'file', dbtab:'${dbtabpath}' content: '${data}'`);
      }
      this.dbCachePin.clear();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async loadData() {
    for (const db of fs.readdirSync(this.dbDir, { withFileTypes: true })) {
      if (db.isDirectory()) {
        const dbPath = path.join(this.dbDir, db.name);
        for (const table of fs.readdirSync(dbPath, { withFileTypes: true })) {
          if (table.isFile() && table.name.endsWith('.json')) {
            const filePath = path.join(dbPath, table.name);
            const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
            /** @type {StoreFormat} */
            const parsedData = JSON.parse(data);
            const key = `${db.name}@${path.basename(table.name, '.json')}`;
            this.dbCache.set(key, parsedData);
          }
        }
      }
    }
  }
}

module.exports = FileDB