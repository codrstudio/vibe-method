/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WA_SIM_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
