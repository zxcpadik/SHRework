declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      DB_HOST: string;
      DB_PORT: number;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_NAME: string;

      HTTPS_ENABLED: string;
      HTTPS_REDIRECT: string;
      HTTPS_CERT: string;
      HTTPS_PKEY: string;
      HTTPS_CA: string;
      HTTP_ENABLED: string;
    }
  }
}

export {};
