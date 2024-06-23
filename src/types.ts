export interface ResponseData {
  state: "ok" | "err"
  data?: object
  errmsg?: string
  errcode?: string
}

export type DBStore = 'file' | 'memory';

export type DBTableType = Map<string, object>;
export type DBSchemaType = Map<string, DBTableType>;
export type DBDatabaseType = Map<string, DBSchemaType>;

export interface IDB {
  databasesCache: DBDatabaseType

  getStore(): DBStore

  getDbs(): string[]
  getSchs(db: string): string[]
  getTabs(db: string, sch: string): string[]
  update(db: string, sch: string, tab: string, data: object): void
  query(db: string, sch: string, tab: string): object
  delete(db: string, sch: string, tab: string): void
}