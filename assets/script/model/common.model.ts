
export namespace Common {

  export interface DBDoc {
    _id?: string
    _rev?: string
  }

  export interface DBInfo {
    name: string
    path?: string
    size: number
  }
}