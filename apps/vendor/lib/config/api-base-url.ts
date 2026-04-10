const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}

const normalizedApiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl.trim())

export function withApiBaseUrl(pathOrUrl: string) {
  if (!normalizedApiBaseUrl) return pathOrUrl
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  return `${normalizedApiBaseUrl}${normalizedPath}`
}

export function getApiBaseUrl() {
  return normalizedApiBaseUrl
}
