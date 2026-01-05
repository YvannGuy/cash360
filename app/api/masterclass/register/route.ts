import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que supabaseAdmin est disponible
    if (!supabaseAdmin) {
      console.error('[MASTERCLASS-REGISTER] Supabase Admin non configuré')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur. Veuillez contacter le support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      registrationType,
      projectDescription
    } = body

    // Validation
    if (!firstName || !lastName || !email || !phone || !registrationType) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    if (registrationType === 'pitch' && !projectDescription) {
      return NextResponse.json(
        { error: 'La description du projet est requise pour les inscriptions au pitch' },
        { status: 400 }
      )
    }

    // Vérifier si l'email n'est pas déjà inscrit
    const { data: existingRegistration } = await supabaseAdmin
      .from('masterclass_registrations')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Cet email est déjà inscrit à la masterclass' },
        { status: 400 }
      )
    }

    // Créer l'inscription
    const { data: registration, error: insertError } = await supabaseAdmin
      .from('masterclass_registrations')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase().trim(),
        phone: phone,
        country: country || null,
        registration_type: registrationType,
        project_description: registrationType === 'pitch' ? projectDescription : null,
        payment_status: 'pending',
        amount: 15.00,
        currency: 'USD'
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[MASTERCLASS-REGISTER] Erreur insertion:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'inscription. Veuillez réessayer.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      message: 'Inscription créée avec succès'
    })
  } catch (error: any) {
    console.error('[MASTERCLASS-REGISTER] Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}

