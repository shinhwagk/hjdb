import * as fs from "fs"
import * as path from "path"

import { MemDB } from "./memdb"
import { DBStore } from "./types"

export class FileDB extends MemDB {
  private readonly dbCachePin = new Set<string>()

  constructor(private readonly dbDir: string) {
    super();
    this.loadData();
    this.checkpoint();
  }

  getStore(): DBStore {
    return 'file'
  }

  query(db: string, sch: string, tab: string): object {
    return super.query(db, sch, tab);
  }

  delete(db: string, sch: string, tab: string) {
    super.delete(db, sch, tab);
    this.dbCachePin.delete(`${db}@${sch}@${tab}`)
    if (fs.existsSync(path.join(this.dbDir, db, `${tab}.json`))) {
      fs.unlinkSync(path.join(this.dbDir, db, `${tab}.json`));
    }
    if (!this.databasesCache.has(db)) {
      fs.unlinkSync(path.join(this.dbDir, db))
      console.log("remove db: " + db)
    }
  }

  update(db: string, sch: string, tab: string, data: object) {
    super.update(db, sch, tab, data);
    this.dbCachePin.add(`${db}@${sch}@${tab}`);
  }

  private async checkpoint(): Promise<void> {
    while (true) {
      for (const dbtab of this.dbCachePin) {
        const [db, sch, tab] = dbtab.split("@")
        const content = this.databasesCache.get(db)?.get(sch)?.get(tab)!;
        const schDir = path.join(this.dbDir, db, sch);
        if (!fs.existsSync(schDir)) {
          fs.mkdirSync(schDir, { recursive: true });
        }
        const data = JSON.stringify(content);
        fs.writeFileSync(path.join(schDir, `${tab}.json`), data, { encoding: 'utf-8' });
        console.log(`${new Date().toLocaleString()} checkpoint storage:'file', db:'${db}', sch:'${sch}',tab:'${tab}', content: '${data}'`);

      }
      this.dbCachePin.clear();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async loadData() {
    for (const db of fs.readdirSync(this.dbDir, { withFileTypes: true })) {
      if (db.isDirectory()) {
        const dbPath = path.join(this.dbDir, db.name);
        for (const sch of fs.readdirSync(dbPath, { withFileTypes: true })) {
          if (sch.isDirectory()) {
            const schPath = path.join(dbPath, sch.name);
            for (const tab of fs.readdirSync(schPath, { withFileTypes: true })) {
              if (tab.isFile() && tab.name.endsWith('.json')) {
                const tabPath = path.join(schPath, tab.name);
                const data = JSON.parse(fs.readFileSync(tabPath, { encoding: 'utf-8' })) as object;
                super.update(db.name, sch.name, tab.name.split(".")[0], data);
              }
            }

          }
        }
      }
    }
  }
}
