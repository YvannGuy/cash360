import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { data: products, error } = await supabaseAdmin!
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des produits:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      products: products || []
    })
  } catch (error) {
    console.error('Erreur API admin products GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      price,
      originalPrice,
      isPack,
      imageUrl,
      isOneTime
    } = body

    // Validation
    if (!id || !name || !price) {
      return NextResponse.json(
        { error: 'ID, nom et prix sont obligatoires' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin!
      .from('products')
      .insert({
        id,
        name,
        description: description || null,
        price,
        original_price: originalPrice || null,
        is_pack: isPack || false,
        image_url: imageUrl || null,
        available: true,
        is_one_time: isOneTime !== undefined ? isOneTime : true
      })
      .select()

    if (error) {
      console.error('Erreur lors de la création du produit:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: data[0]
    })
  } catch (error) {
    console.error('Erreur API admin products POST:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit manquant' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      originalPrice,
      isPack,
      imageUrl,
      available,
      isOneTime
    } = body

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nom et prix sont obligatoires' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin!
      .from('products')
      .update({
        name,
        description: description || null,
        price,
        original_price: originalPrice || null,
        is_pack: isPack || false,
        image_url: imageUrl || null,
        available: available !== undefined ? available : true,
        is_one_time: isOneTime !== undefined ? isOneTime : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()

    if (error) {
      console.error('Erreur lors de la mise à jour du produit:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: data[0]
    })
  } catch (error) {
    console.error('Erreur API admin products PUT:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit manquant' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin!
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Erreur lors de la suppression du produit:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Erreur API admin products DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

