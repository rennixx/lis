/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly more: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}