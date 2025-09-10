import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialisation conditionnelle de Resend
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const status = formData.get('status') as string;

    // Validation des données
    if (!fullName || !email || !phone || !status) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Envoi de l'email via Resend
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: [process.env.DESTINATION_EMAIL || 'your-email@example.com'],
      subject: `Nouvelle inscription Cash360 - ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #1e293b, #1e40af); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Nouvelle inscription Cash360</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Une nouvelle personne s'est inscrite à votre formation</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #fbbf24; padding-bottom: 10px;">Informations du candidat</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">👤 Nom complet :</strong>
              <span style="color: #6b7280; margin-left: 10px;">${fullName}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">📧 Email :</strong>
              <span style="color: #6b7280; margin-left: 10px;">${email}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">📱 Téléphone :</strong>
              <span style="color: #6b7280; margin-left: 10px;">${phone}</span>
            </div>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #374151;">🏷️ Statut :</strong>
              <span style="color: #6b7280; margin-left: 10px; text-transform: capitalize;">${status}</span>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #fbbf24;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                💡 <strong>Action recommandée :</strong> Contactez rapidement ce prospect pour maximiser les chances de conversion !
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
            <p>Email envoyé automatiquement depuis votre site Cash360</p>
            <p>Date : ${new Date().toLocaleString('fr-FR', { 
              timeZone: 'Europe/Paris',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    console.log('Email envoyé avec succès:', data);
    
    return NextResponse.json(
      { message: 'Inscription enregistrée avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
