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
    return [...(this.databasesCache.get(db)?.keys() ?? [])]

  }

  getTabs(db: string, sch: string): string[] {
    return [...(this.databasesCache.get(db)?.get(sch)?.keys() ?? [])]
  }

  private validateName(name: string, code: HJDBErrorCode) {
    if (!validateName(name)) {
      throw HJDBError.new(code)
    }
  }

  query(db: string, sch: string, tab: string): object {
    this.validateName(db, HJDBErrorCode.HJDB003)
    if (!this.databasesCache.get(db)) {
      throw HJDBError.new(HJDBErrorCode.HJDB002)
    } else {
      this.validateName(sch, HJDBErrorCode.HJDB006)
      if (!this.databasesCache.get(db)?.get(sch)) {
        throw HJDBError.new(HJDBErrorCode.HJDB005)
      } else {
        this.validateName(tab, HJDBErrorCode.HJDB005)
        if (!this.databasesCache.get(db)?.get(sch)?.get(tab)) {
          throw HJDBError.new(HJDBErrorCode.HJDB001)
        } else {
          return this.databasesCache.get(db)?.get(sch)?.get(tab) ?? {}
        }
      }
    }
  }

  async delete(db: string, sch: string, tab: string) {
    this.databasesCache.get(db)?.get(sch)?.delete(tab)

    if (this.getTabs(db, sch).length === 0) {
      this.databasesCache.get(db)?.delete(sch)
      if (this.getSchs(db).length === 0) {
        this.databasesCache.delete(db)
      }
    }
  }

  update(db: string, sch: string, tab: string, data: object) {
    this.validateName(db, HJDBErrorCode.HJDB003)
    this.validateName(sch, HJDBErrorCode.HJDB006)
    this.validateName(tab, HJDBErrorCode.HJDB004)

    if (!this.databasesCache.has(db)) {
      this.databasesCache.set(db, new Map())
      this.databasesCache.get(db)?.set(sch, new Map())
    } else if (!this.databasesCache.get(db)?.has(sch)) {
      this.databasesCache.get(db)?.set(sch, new Map())
    }

    this.databasesCache.get(db)?.get(sch)?.set(tab, data)
  }
}

