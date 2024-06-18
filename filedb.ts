import * as fs from "fs"
import * as path from "path"

import { MemDB } from "./memdb"

export class FileDB extends MemDB {
  private readonly dbCachePin = new Set<string>()

  constructor(private readonly dbDir: string) {
    super();
    this.loadData();
    this.checkpoint();
  }

  query(db: string, tab: string): object {
    return super.query(db, tab);
  }

  delete(db: string, tab: string) {
    super.delete(db, tab);
    this.dbCachePin.delete(`${db}@${tab}`)
    if (fs.existsSync(path.join(this.dbDir, db, `${tab}.json`))) {
      fs.unlinkSync(path.join(this.dbDir, db, `${tab}.json`));
    }
  }

  update(db: string, tab: string, data: object) {
    super.update(db, tab, data);
    this.dbCachePin.add(`${db}@${tab}`);
  }

  async checkpoint(): Promise<void> {

    while (true) {
      for (const dbtab of this.dbCachePin) {
        const [db, tab] = dbtab.split("@")
        const content = this.dbsCache.get(db)?.get(tab)!;
        const dbdir = path.join(this.dbDir, db);
        if (!fs.existsSync(dbdir)) {
          fs.mkdirSync(dbdir, { recursive: true });
        }
        const data = JSON.stringify(content);
        fs.writeFileSync(path.join(dbdir, `${tab}.json`), data, { encoding: 'utf-8' });
        console.log(`${new Date().toLocaleString()} checkpoint storage:'file', db:'${db}', tab:'${tab}', content: '${data}'`);
      }
      this.dbCachePin.clear();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async loadData() {
    for (const db of fs.readdirSync(this.dbDir, { withFileTypes: true })) {
      if (db.isDirectory()) {
        const dbPath = path.join(this.dbDir, db.name);
        const tablesMap = new Map<string, any>();

        for (const table of fs.readdirSync(dbPath, { withFileTypes: true })) {
          if (table.isFile() && table.name.endsWith('.json')) {
            const filePath = path.join(dbPath, table.name);
            const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
            const parsedData = JSON.parse(data) as object;
            const tableName = path.basename(table.name, '.json');

            tablesMap.set(tableName, parsedData);
          }
        }
        this.dbsCache.set(db.name, tablesMap);
      }
    }
  }
}
