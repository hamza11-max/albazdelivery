import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/errors'

// Lookup product details from external APIs using EAN/UPC barcode
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barcode = searchParams.get('barcode')

    if (!barcode || barcode.length < 8) {
      return errorResponse(new Error('Invalid barcode. EAN/UPC codes must be at least 8 digits.'), 400)
    }

    // Try multiple product databases
    const productData = await fetchProductFromAPIs(barcode)

    if (!productData) {
      return successResponse({ product: null, message: 'Product not found in external databases' })
    }

    return successResponse({ product: productData })
  } catch (error) {
    console.error('[API] Product lookup error:', error)
    return errorResponse(error)
  }
}

async function fetchProductFromAPIs(barcode: string): Promise<any | null> {
  // Try Open Food Facts API (free, no API key required)
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'AL-baz Delivery App - Product Lookup',
      },
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.status === 1 && data.product) {
        const product = data.product
        return {
          name: product.product_name || product.product_name_fr || product.product_name_en || '',
          category: product.categories || product.categories_tags?.[0] || '',
          description: product.ingredients_text || product.ingredients_text_fr || product.ingredients_text_en || '',
          image: product.image_url || product.image_front_url || product.image_front_small_url || '',
          price: null, // Open Food Facts doesn't provide pricing
          brand: product.brands || '',
          weight: product.quantity || '',
          nutrition: product.nutriments ? {
            energy: product.nutriments['energy-kcal_100g'],
            fat: product.nutriments.fat_100g,
            carbs: product.nutriments.carbohydrates_100g,
            protein: product.nutriments.proteins_100g,
          } : null,
        }
      }
    }
  } catch (error) {
    console.warn('[Product Lookup] Open Food Facts API error:', error)
  }

  // Try UPCitemdb API as fallback
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      headers: {
        'User-Agent': 'AL-baz Delivery App',
      },
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.code === 'OK' && data.items && data.items.length > 0) {
        const item = data.items[0]
        return {
          name: item.title || item.description || '',
          category: item.category || '',
          description: item.description || '',
          image: item.images?.[0] || '',
          price: item.lowest_recorded_price || null,
          brand: item.brand || '',
          weight: null,
          nutrition: null,
        }
      }
    }
  } catch (error) {
    console.warn('[Product Lookup] UPCitemdb API error:', error)
  }

  // Try Barcode Lookup API
  try {
    const response = await fetch(`https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=demo`, {
      headers: {
        'User-Agent': 'AL-baz Delivery App',
      },
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0]
        return {
          name: product.product_name || product.title || '',
          category: product.category || '',
          description: product.description || '',
          image: product.images?.[0] || '',
          price: product.stores?.[0]?.price || null,
          brand: product.brand || '',
          weight: product.size || '',
          nutrition: null,
        }
      }
    }
  } catch (error) {
    console.warn('[Product Lookup] Barcode Lookup API error:', error)
  }

  return null
}

