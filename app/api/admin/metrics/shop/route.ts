import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/metrics/shop?range=7d|30d
 * 
 * Retourne les métriques e-commerce (produits, conversions)
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const days = range === '7d' ? 7 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateISO = startDate.toISOString()

    // Top produits consultés
    const { data: productViews } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'shop.product_viewed')
      .gte('created_at', startDateISO)

    const productViewStats = new Map<string, number>()
    productViews?.forEach((event: any) => {
      const productId = event.payload?.productId || event.payload?.product_id
      if (productId) {
        productViewStats.set(productId, (productViewStats.get(productId) || 0) + 1)
      }
    })

    // Add to cart
    const { data: addToCarts } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'shop.add_to_cart')
      .gte('created_at', startDateISO)

    const addToCartStats = new Map<string, number>()
    addToCarts?.forEach((event: any) => {
      const productId = event.payload?.productId || event.payload?.product_id
      if (productId) {
        addToCartStats.set(productId, (addToCartStats.get(productId) || 0) + 1)
      }
    })

    // Checkouts initiés
    const { data: checkouts } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'shop.checkout_started')
      .gte('created_at', startDateISO)

    // Achats complétés
    const { data: purchases } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'shop.purchase_completed')
      .gte('created_at', startDateISO)

    const purchaseStats = new Map<string, { count: number, revenue: number }>()
    purchases?.forEach((event: any) => {
      const items = event.payload?.items || []
      items.forEach((item: any) => {
        const productId = item.productId || item.product_id || item.id
        if (productId) {
          const current = purchaseStats.get(productId) || { count: 0, revenue: 0 }
          purchaseStats.set(productId, {
            count: current.count + (item.quantity || 1),
            revenue: current.revenue + (parseFloat(item.price || item.amount || 0) * (item.quantity || 1))
          })
        }
      })
    })

    // Récupérer les noms des produits
    const allProductIds = [
      ...Array.from(productViewStats.keys()),
      ...Array.from(addToCartStats.keys()),
      ...Array.from(purchaseStats.keys())
    ]
    const uniqueProductIds = [...new Set(allProductIds)]

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .in('id', uniqueProductIds.length > 0 ? uniqueProductIds : [''])

    const productMap = new Map<string, string>()
    products?.forEach((p: any) => {
      productMap.set(p.id, p.name)
    })

    // Construire les métriques par produit
    const productMetrics = uniqueProductIds.map(productId => {
      const views = productViewStats.get(productId) || 0
      const addToCarts = addToCartStats.get(productId) || 0
      const purchases = purchaseStats.get(productId) || { count: 0, revenue: 0 }
      const conversionRate = views > 0 ? (purchases.count / views) * 100 : 0

      return {
        productId,
        productName: productMap.get(productId) || productId,
        views,
        addToCarts,
        purchases: purchases.count,
        revenue: purchases.revenue,
        conversionRate
      }
    }).sort((a, b) => b.views - a.views)

    return NextResponse.json({
      success: true,
      shop: {
        productMetrics,
        totalViews: productViews?.length || 0,
        totalAddToCarts: addToCarts?.length || 0,
        totalCheckouts: checkouts?.length || 0,
        totalPurchases: purchases?.length || 0,
        overallConversionRate: (productViews?.length || 0) > 0 
          ? ((purchases?.length || 0) / (productViews?.length || 0)) * 100 
          : 0
      },
      range,
      computedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[METRICS SHOP] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des métriques boutique' },
      { status: 500 }
    )
  }
}
