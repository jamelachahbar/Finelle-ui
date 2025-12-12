/// <reference types="vite/client" />

// Extend Vite's ImportMetaEnv interface
interface ImportMetaEnv {
  readonly VITE_APPINSIGHTS_CONNECTION_STRING?: string
  readonly VITE_BACKEND_URL?: string
}
