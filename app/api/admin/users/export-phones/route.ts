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

    // Récupérer tous les utilisateurs avec pagination
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let userPage = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: userPage,
        perPage: MAX_PER_PAGE
      })

      if (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des utilisateurs' },
          { status: 500 }
        )
      }

      const batch = data?.users || []
      allUsersList.push(...batch)

      if (batch.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        userPage += 1
      }
    }

    // Extraire les numéros de téléphone
    const phoneData = allUsersList
      .filter(user => user.email) // Filtrer les utilisateurs sans email
      .map(user => {
        const phone = user.user_metadata?.phone || ''
        const email = user.email || ''
        const firstName = user.user_metadata?.first_name || ''
        const lastName = user.user_metadata?.last_name || ''
        const name = `${firstName} ${lastName}`.trim() || email.split('@')[0]
        
        return {
          name,
          email,
          phone: phone || ''
        }
      })
      .filter(user => user.phone) // Filtrer uniquement ceux qui ont un téléphone

    // Générer le CSV
    const headers = ['Nom', 'Email', 'Téléphone']
    const csvRows = [
      headers.join(','),
      ...phoneData.map(user => [
        `"${user.name.replace(/"/g, '""')}"`,
        `"${user.email.replace(/"/g, '""')}"`,
        `"${user.phone.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    // Ajouter le BOM UTF-8 pour Excel
    const csvWithBOM = '\uFEFF' + csvRows

    // Retourner le CSV
    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="telephones_utilisateurs_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

