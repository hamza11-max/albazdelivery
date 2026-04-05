import JsBarcode from "jsbarcode"

export function createOfflineCode128DataUri(value: string): string {
  const data = value.trim()
  if (!data) {
    throw new Error("MISSING_BARCODE_DATA")
  }

  const encoded: {
    encodings?: Array<{
      data: string
      options?: { width?: number; height?: number }
    }>
  } = {}

  JsBarcode(encoded as unknown as SVGElement, data, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    width: 1.6,
    height: 52,
  })

  const firstEncoding = encoded.encodings?.[0]
  if (!firstEncoding?.data) {
    throw new Error("BARCODE_GENERATION_FAILED")
  }

  const pattern = firstEncoding.data
  const barWidth = firstEncoding.options?.width ?? 1.6
  const barHeight = firstEncoding.options?.height ?? 52
  const svgWidth = pattern.length * barWidth

  let rects = ""
  let i = 0
  while (i < pattern.length) {
    if (pattern[i] !== "1") {
      i++
      continue
    }
    let run = 1
    while (i + run < pattern.length && pattern[i + run] === "1") {
      run++
    }
    rects += `<rect x="${(i * barWidth).toFixed(2)}" y="0" width="${(run * barWidth).toFixed(2)}" height="${barHeight}" fill="#000"/>`
    i += run
  }

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth.toFixed(2)}" height="${barHeight}" viewBox="0 0 ${svgWidth.toFixed(2)} ${barHeight}" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
}
