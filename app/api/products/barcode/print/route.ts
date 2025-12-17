import { NextRequest } from 'next/server'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { auth } from '@/lib/auth'

// Generate and return barcode image/PDF for printing
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const barcode = searchParams.get('barcode')
    const name = searchParams.get('name') || 'Product'

    if (!barcode || barcode.length < 8) {
      return errorResponse(new Error('Invalid barcode'), 400)
    }

    // Generate barcode image URL (using online service)
    // For production, you might want to use a library like jsbarcode or generate server-side
    const barcodeImageUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcode)}&code=EAN13&dpi=300&dataseparator=`

    // For PDF generation, we'll return the image URL
    // In production, you might want to generate a PDF server-side using a library like pdfkit
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${name}</title>
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
            <div class="product-name">${name}</div>
            <img src="${barcodeImageUrl}" alt="Barcode ${barcode}" class="barcode-image" />
            <div class="barcode-number">${barcode}</div>
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

