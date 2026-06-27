/// <reference types="vite/client" />
/// <reference types="vitest/config" />

interface ImportMetaEnv {
  readonly VITE_LOG_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
