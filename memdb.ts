import { StoreFormat } from "./types"
import { HJDBErrorCode, HJDBError, HJDBErrorMsg } from "./error"


export class MemDB {
  protected readonly dbCache = new Map<string, StoreFormat>();

  getDbs() {
    return [...this.dbCache.keys()]
  }

  getTabs(db: string): string[] {
    const tabs = [... this.dbCache.keys()].filter(k => k.split("@")[0] === db)
    if (tabs.length === 0) {
      throw new HJDBError(HJDBErrorCode.HJDB002);
    }
    return [... this.dbCache.keys()].filter(k => k.split("@")[0] === db).map(k => k.split("@")[1])
  }

  query(db: string, tab: string) {
    const dbtabpath = `${db}@${tab}`;
    return this.dbCache.get(dbtabpath) ?? null;
  }

  delete(db: string, tab: string) {
    const dbtabpath = `${db}@${tab}`;
    this.dbCache.delete(dbtabpath);
  }

  update(db: string, tab: string, data: object) {
    const dbtabpath = `${db}@${tab}`;
    var storeData = this.dbCache.get(dbtabpath);
    if (storeData) {
      storeData.mts = (new Date()).getTime();
      storeData.data = data;
    } else {
      const ts = (new Date()).getTime();
      storeData = { cts: ts, mts: ts, data: data };
    }
    this.dbCache.set(dbtabpath, storeData);
  }
}
