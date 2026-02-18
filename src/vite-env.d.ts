/// <reference types="vite/client" />

// Individual icon imports from @hugeicons/core-free-icons/*
declare module '@hugeicons/core-free-icons/*' {
  type IconSvgObject = ([string, { [key: string]: string | number }])[] | readonly (readonly [string, { readonly [key: string]: string | number }])[]
  const icon: IconSvgObject
  export default icon
}

interface ImportMetaEnv {
  readonly VITE_SLACK_CLIENT_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_HUGGINGFACE_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
