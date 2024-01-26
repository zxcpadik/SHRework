declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      DB_HOST?: string;
      DB_PORT?: number;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;

      HTTPS_ENABLED?: boolean;
      HTTPS_REDIRECT?: boolean;
      HTTPS_CERT?: string;
      HTTPS_PKEY?: string;
      HTTP_ENABLED?: boolean;
    }
  }
}

export {}