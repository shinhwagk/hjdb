import { unlink, mkdir, readdir, rmdir } from 'fs/promises';
import * as path from "path"

import { MemDB } from "./memdb"
import { DBStore } from "./types"

export class FileDB extends MemDB {
  private readonly dbCachePin = new Set<string>()

  constructor(private readonly dbDir: string) {
    super();
    (async () => {
      while (true) {
        await this.checkpoint();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    })()
  }

  getStore(): DBStore {
    return 'file'
  }

  query(db: string, sch: string, tab: string): object {
    return super.query(db, sch, tab);
  }

  async delete(db: string, sch: string, tab: string) {
    super.delete(db, sch, tab);

    this.dbCachePin.delete(`${db}@${sch}@${tab}`)

    if (await Bun.file(path.join(this.dbDir, db, sch, `${tab}.json`)).exists()) {
      await unlink(path.join(this.dbDir, db, sch, `${tab}.json`));
    }

    if (super.getTabs(db, sch).length === 0) {
      await rmdir(path.join(this.dbDir, db, sch))
      if (super.getSchs(db).length === 0) {
        await rmdir(path.join(this.dbDir, db))
      }
    }
  }

  update(db: string, sch: string, tab: string, data: object) {
    super.update(db, sch, tab, data);
    this.dbCachePin.add(`${db}@${sch}@${tab}`);
  }

  public async checkpoint(): Promise<void> {
    for (const dbtab of this.dbCachePin) {
      const [db, sch, tab] = dbtab.split("@")
      const content = this.databasesCache.get(db)?.get(sch)?.get(tab)!;
      const schDir = path.join(this.dbDir, db, sch);

      if (!(await Bun.file(schDir).exists())) {
        await mkdir(schDir, { recursive: true });
      }
      await Bun.write(path.join(schDir, `${tab}.json`), JSON.stringify(content));
      console.log(`${new Date().toLocaleString()} checkpoint storage:'file', db:'${db}', sch:'${sch}', tab:'${tab}'`);
    }
    this.dbCachePin.clear();
  }

  public async loadData() {
    for (const db of await readdir(this.dbDir, { withFileTypes: true })) {
      if (db.isDirectory()) {
        const dbPath = path.join(this.dbDir, db.name);
        for (const sch of await readdir(dbPath, { withFileTypes: true })) {
          if (sch.isDirectory()) {
            const schPath = path.join(dbPath, sch.name);
            for (const tab of await readdir(schPath, { withFileTypes: true })) {
              if (tab.isFile() && tab.name.endsWith('.json')) {
                const tabPath = path.join(schPath, tab.name);
                const data = await Bun.file(tabPath).json()
                super.update(db.name, sch.name, tab.name.split(".")[0], data);
                console.log(`${new Date().toLocaleString()} loading storage:'file', db:'${db.name}', sch:'${sch.name}', tab:'${tab.name}'`);
              }
            }
          }
        }
      }
    }
  }
}
