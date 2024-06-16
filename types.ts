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
  err?: string
  store?: "file" | "memory"
  cts?: number
  mts?: number
}