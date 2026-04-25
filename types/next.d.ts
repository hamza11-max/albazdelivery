declare module 'next' {
  export interface Metadata {
    title?: string | { default?: string; template?: string };
    description?: string;
    [key: string]: any;
  }

  export interface Viewport {
    width?: number | 'device-width';
    height?: number | 'device-height';
    initialScale?: number;
    minimumScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
    viewportFit?: 'auto' | 'contain' | 'cover';
    [key: string]: any;
  }
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string, options?: { scroll?: boolean }) => void;
    replace: (url: string, options?: { scroll?: boolean }) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
  
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function notFound(): never;
  export function redirect(url: string): never;
  export function permanentRedirect(url: string): never;
}

declare module 'next/server' {
  import { NextRequest, NextResponse } from 'next/server';
  export { NextRequest, NextResponse };
}