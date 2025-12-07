// Minimal shims for Next internal modules that some tools import as .js files
declare module 'next/server.js' {
  export type NextRequest = any;
  export type NextResponse = any;
}

declare module 'next/types.js' {
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module 'next/dist/lib/metadata/types/metadata-interface.js' {
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module 'next/font/google' {
  export const Inter: any;
  export const JetBrains_Mono: any;
}
