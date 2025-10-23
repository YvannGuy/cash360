import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      })
    }

    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Email utilisateur requis'
      })
    }

    // Récupérer l'utilisateur par email
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs',
        details: usersError.message
      })
    }

    const user = users.find(u => u.email === userEmail)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      })
    }

    // Mettre à jour les analyses avec user_id null qui correspondent à l'email client
    const { data: updatedAnalyses, error: updateError } = await supabaseAdmin
      .from('analyses')
      .update({ user_id: user.id })
      .eq('client_email', userEmail)
      .is('user_id', null)
      .select()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour des analyses',
        details: updateError.message
      })
    }

    return NextResponse.json({
      success: true,
      message: `${updatedAnalyses?.length || 0} analyses mises à jour`,
      updatedAnalyses: updatedAnalyses?.map(a => ({
        id: a.id,
        ticket: a.ticket,
        client_name: a.client_name,
        client_email: a.client_email,
        user_id: a.user_id
      })) || []
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des analyses:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}
