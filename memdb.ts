import { StoreFormat } from "./types"
import { HJDBErrorCode, HJDBError } from "./error"

export class MemDB {
  protected readonly dbsCache = new Map<string, Map<string, StoreFormat>>();
  protected readonly dbTabsCache = new Map<string, StoreFormat>();

  getDbs() {
    return [...this.dbsCache.keys()]
  }

  getTabs(db: string): string[] {
    if (this.dbsCache.get(db)) {
      return [...this.dbsCache.get(db)?.keys()!]
    } else {
      throw HJDBError.new(HJDBErrorCode.HJDB002);
    }
  }

  query(db: string, tab: string): StoreFormat {
    if (this.dbsCache.get(db)) {
      const dbCache = this.dbsCache.get(db)!;
      if (dbCache.get(tab)) {
        return dbCache.get(tab)!
      } else {
        throw HJDBError.new(HJDBErrorCode.HJDB001);
      }
    } else {
      throw HJDBError.new(HJDBErrorCode.HJDB002);
    }
  }

  delete(db: string, tab: string) {
    if (this.dbsCache.get(db)) {
      if (this.dbsCache.get(db)?.get(tab)) {
        this.dbsCache.get(db)?.delete(tab);
      } else {
        throw HJDBError.new(HJDBErrorCode.HJDB001);
      }
    } else {
      throw HJDBError.new(HJDBErrorCode.HJDB002);
    }
  }

  update(db: string, tab: string, data: object) {
    if (this.dbsCache.get(db) === undefined) {
      this.dbsCache.set(db, new Map())
    }

    if (this.dbsCache.get(db)?.get(tab)) {
      this.dbsCache.get(db)!.get(tab)!.data = data
      this.dbsCache.get(db)!.get(tab)!.mts = (new Date()).getTime();
    } else {
      const ts = (new Date()).getTime();
      this.dbsCache.get(db)!.set(tab, { cts: ts, mts: ts, data: data })
    }
  }
}
