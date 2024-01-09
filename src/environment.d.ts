declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      DB_HOST?: string;
      DB_PORT?: number;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;
    }
  }
}

export {}