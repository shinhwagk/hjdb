import { HJDBErrorCode, HJDBError } from "./error"
import { validateName } from "./helper"
import { IDB, DBStore, DBDatabaseType } from "./types"

export class MemDB implements IDB {
  readonly databasesCache: DBDatabaseType = new Map();

  getStore(): DBStore {
    return 'memory'
  }

  getDbs() {
    return [...this.databasesCache.keys()]
  }

  getSchs(db: string): string[] {
    this.checkObjectValidate(db)
    return [...this.databasesCache.get(db)!.keys()]

  }

  getTabs(db: string, sch: string): string[] {
    this.checkObjectValidate(db, sch)
    return [...this.databasesCache.get(db)!.get(sch)!.keys()]
  }

  checkObjectValidate(db: string, sch?: string, tab?: string) {
    this.validateName(db, HJDBErrorCode.HJDB003)
    const dbCache = this.databasesCache.get(db);
    if (!dbCache) {
      throw HJDBError.new(HJDBErrorCode.HJDB002)
    }

    if (sch) {
      this.validateName(sch, HJDBErrorCode.HJDB006)
      const schCache = dbCache.get(sch)
      if (!schCache) {
        throw HJDBError.new(HJDBErrorCode.HJDB005)
      }

      if (tab) {
        this.validateName(tab, HJDBErrorCode.HJDB005)
        const tabCache = schCache.get(tab)
        if (!tabCache) {
          throw HJDBError.new(HJDBErrorCode.HJDB001)
        }
      }
    }
  }

  private validateName(name: string, code: HJDBErrorCode) {
    if (!validateName(name)) {
      throw HJDBError.new(code)
    }
  }

  query(db: string, sch: string, tab: string): object {
    this.checkObjectValidate(db, sch, tab)
    return this.databasesCache.get(db)!.get(sch)!.get(tab)!
  }

  delete(db: string, sch: string, tab: string) {
    this.checkObjectValidate(db, sch, tab)

    this.databasesCache.get(db)?.get(sch)?.delete(tab)

    if (this.databasesCache.get(db)?.get(sch)?.size ?? 0 >= 1) {
      this.databasesCache.get(db)?.delete(sch)
    }

    if (this.databasesCache.get(db)?.size || 0 >= 1) {
      this.databasesCache.delete(db)
    }
  }

  update(db: string, sch: string, tab: string, data: object) {
    this.validateName(db, HJDBErrorCode.HJDB003)
    this.validateName(sch, HJDBErrorCode.HJDB006)
    this.validateName(tab, HJDBErrorCode.HJDB004)

    if (!this.databasesCache.has(db)) {
      this.databasesCache.set(db, new Map())
    }

    if (!this.databasesCache.get(db)?.has(sch)) {
      this.databasesCache.get(db)?.set(sch, new Map())
    }

    this.databasesCache.get(db)?.get(sch)?.set(tab, data)
  }
}

