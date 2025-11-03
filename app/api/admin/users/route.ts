import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer tous les utilisateurs authentifiés
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()

    if (authUsersError) {
      console.error('Erreur lors de la récupération des utilisateurs auth:', authUsersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      )
    }

    // Récupérer toutes les analyses pour compter par utilisateur
    const { data: analysisEmails, error: analysisEmailsError } = await supabaseAdmin
      .from('analyses')
      .select('client_email, client_name, created_at')

    if (analysisEmailsError) {
      console.error('Erreur lors de la récupération des emails d\'analyses:', analysisEmailsError)
    }

    // Compter les analyses par email
    const analysisCountMap = new Map<string, number>()
    const nameMap = new Map<string, string>()
    
    analysisEmails?.forEach(analysis => {
      const email = analysis.client_email
      analysisCountMap.set(email, (analysisCountMap.get(email) || 0) + 1)
      if (analysis.client_name) {
        nameMap.set(email, analysis.client_name)
      }
    })

    // Transformer tous les utilisateurs authentifiés
    const allUsers = (authUsers?.users || [])
      .filter(authUser => authUser.email) // Filtrer les utilisateurs sans email
      .map(authUser => {
        const role = authUser.user_metadata?.role || 'user'
        const analysisCount = analysisCountMap.get(authUser.email || '') || 0
        const name = nameMap.get(authUser.email || '') || authUser.user_metadata?.first_name + ' ' + authUser.user_metadata?.last_name || ''
        
        return {
          id: authUser.id,
          email: authUser.email,
          name: name.trim() || undefined,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          first_analysis_date: null, // Peut être enrichi si nécessaire
          analysis_count: analysisCount,
          is_authenticated: true,
          role: role
        }
      })

    // Trier par date de création (plus récent en premier)
    allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      users: allUsers
    })

  } catch (error) {
    console.error('Erreur API users:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ID utilisateur et rôle requis' },
        { status: 400 }
      )
    }

    // Vérifier que le rôle est valide
    if (!['user', 'admin', 'commercial'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Les rôles valides sont: user, admin, commercial' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur actuel
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour les métadonnées utilisateur avec le nouveau rôle
    const currentMetadata = userData.user.user_metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      role: role
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    )

    if (updateError) {
      console.error('Erreur lors de la mise à jour du rôle:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du rôle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        role: role
      }
    })

  } catch (error) {
    console.error('Erreur API update user role:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Début suppression utilisateur ===')
    
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      console.error('Configuration Supabase manquante')
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      console.error('ID utilisateur manquant')
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    console.log('Suppression de l\'utilisateur:', userId)

    // Récupérer les analyses de l'utilisateur pour supprimer les PDFs
    const { data: userAnalyses, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('pdf_url')
      .or(`user_id.eq.${userId},client_email.eq.${userId}`)

    if (fetchError) {
      console.warn('Erreur lors de la récupération des analyses utilisateur:', fetchError)
    }

    // Supprimer les PDFs des analyses de l'utilisateur
    if (userAnalyses && userAnalyses.length > 0) {
      for (const analysis of userAnalyses) {
        if (analysis.pdf_url) {
          try {
            const url = new URL(analysis.pdf_url)
            const pathParts = url.pathname.split('/')
            const fileName = pathParts[pathParts.length - 1]
            
            if (fileName) {
              console.log('Suppression du PDF utilisateur:', fileName)
              await supabaseAdmin.storage
                .from('analyses')
                .remove([`analyses/${fileName}`])
            }
          } catch (error) {
            console.warn('Erreur lors de la suppression du fichier PDF:', error)
          }
        }
      }
    }

    // Supprimer les analyses de l'utilisateur
    const { error: deleteAnalysesError } = await supabaseAdmin
      .from('analyses')
      .delete()
      .or(`user_id.eq.${userId},client_email.eq.${userId}`)

    if (deleteAnalysesError) {
      console.warn('Erreur lors de la suppression des analyses utilisateur:', deleteAnalysesError)
    }

    // Supprimer l'utilisateur de Supabase Auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', deleteUserError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'utilisateur' },
        { status: 500 }
      )
    }

    console.log('Utilisateur supprimé avec succès:', userId)

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
      deletedUserId: userId
    })

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
