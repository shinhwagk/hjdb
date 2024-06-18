// @ts-check

const fs = require('fs');
const path = require('path');

import { MemDB } from "./memdb"

import { StoreFormat } from "./types"


export class FileDB extends MemDB {
  private readonly dbCachePin = new Set<string>()

  constructor(private readonly dbDir: string) {
    super();
    this.loadData();
    this.checkpoint();
  }

  query(db: string, tab: string): StoreFormat | null {
    return super.query(db, tab);
  }

  delete(db: string, tab: string) {
    super.delete(db, tab);
    fs.unlinkSync(path.join(this.dbDir, db, `${tab}.json`));
  }

  update(db: string, tab: string, data: object) {
    super.update(db, tab, data);
    this.dbCachePin.add(`${db}@${tab}`);
  }

  async checkpoint(): Promise<void> {
    while (true) {
      for (const dbtab of this.dbCachePin) {
        const data = JSON.stringify(this.dbCache.get(dbtab));
        const [db, tab] = dbtab.split("@")
        const dbdir = path.join(this.dbDir, db)
        if (!fs.existsSync(dbdir)) {
          fs.mkdirSync(dbdir, { recursive: true });
        }
        fs.writeFileSync(path.join(dbdir, `${tab}.json`), data, { encoding: 'utf-8' });
        console.log(`${new Date().toLocaleString()} checkpoint storage:'file', dbtab:'${dbtab}' content: '${data}'`);
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
            const parsedData = JSON.parse(data) as StoreFormat;
            const key = `${db.name}@${path.basename(table.name, '.json')}`;
            this.dbCache.set(key, parsedData);
          }
        }
      }
    }
  }
}
