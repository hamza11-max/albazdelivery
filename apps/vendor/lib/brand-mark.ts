import mark from "@/public/logo.png"

function bundledSrc(m: unknown): string {
  if (typeof m === "string") return m
  if (m && typeof m === "object" && "src" in m && typeof (m as { src: unknown }).src === "string") {
    return (m as { src: string }).src
  }
  return "/logo.png"
}

/** Bundled path under `/_next/static/...` so the mark loads in Electron + standalone (not only `/public`). */
export const BRAND_MARK_SRC = bundledSrc(mark)
