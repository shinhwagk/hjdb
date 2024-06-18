export interface StoreFormat {
  cts: number
  mts: number
  data: object
}

export interface ResponseData {
  state: "ok" | "err"
  data?: Object
  db?: string
  tab?: string
  errmsg?: string
  errcode?: string
  store?: "file" | "memory"
  cts?: number
  mts?: number
}

export type DBStore = 'file' | 'memory'

export enum HJDBErrorMsg {
  HJDB001 = "table not exist.",
  HJDB002 = "database not exists.",
}

export enum HJDBErrorCode {
  HJDB001 = "HJDB-001",
  HJDB002 = "HJDB-002",
}