declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database
  }

  export interface QueryExecResult {
    columns: string[]
    values: unknown[][]
  }

  export class Database {
    constructor(data?: Uint8Array)
    exec(sql: string, params?: unknown[]): QueryExecResult[]
    export(): Uint8Array
  }

  const initSqlJs: (options?: { locateFile: (file: string) => string }) => Promise<SqlJsStatic>
  export default initSqlJs
}
