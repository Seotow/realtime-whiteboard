/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_SOCKET_URL?: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
