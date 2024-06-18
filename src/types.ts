export interface ResponseData {
  state: "ok" | "err"
  data?: object
  errmsg?: string
  errcode?: string
}

export type DBStore = 'file' | 'memory';
