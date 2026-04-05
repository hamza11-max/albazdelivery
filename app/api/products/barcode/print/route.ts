import { NextRequest } from 'next/server'
import { errorResponse, UnauthorizedError } from '@/lib/errors'
import { auth } from '@/lib/auth'
import { createOfflineCode128DataUri } from '@/lib/barcode'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Generate printable HTML for a product barcode label (client opens print dialog)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const barcode = searchParams.get('barcode')?.trim()
    const name = (searchParams.get('name') || 'Product').trim() || 'Product'

    if (!barcode) {
      return errorResponse(new Error('Invalid barcode'), 400)
    }

    const safeName = escapeHtml(name)
    const safeBarcode = escapeHtml(barcode)

    const barcodeImageUrl = createOfflineCode128DataUri(barcode)

    // For PDF generation, we'll return the image URL
    // In production, you might want to generate a PDF server-side using a library like pdfkit
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${safeName}</title>
          <style>
            @media print {
              @page {
                size: 50mm 30mm;
                margin: 2mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 5mm;
            }
            .barcode-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .product-name {
              font-size: 10pt;
              font-weight: bold;
              margin-bottom: 2mm;
              word-wrap: break-word;
              max-width: 46mm;
            }
            .barcode-image {
              max-width: 100%;
              height: auto;
            }
            .barcode-number {
              font-size: 8pt;
              margin-top: 2mm;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${safeName}</div>
            <img src="${barcodeImageUrl}" alt="Barcode ${safeBarcode}" class="barcode-image" />
            <div class="barcode-number">${safeBarcode}</div>
          </div>
        </body>
      </html>
    `

    // Return HTML that can be printed
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="barcode-${barcode}.html"`,
      },
    })
  } catch (error) {
    console.error('[API] Barcode print error:', error)
    return errorResponse(error)
  }
}

