import { Resend } from 'resend'

export interface MailOptions {
  to: string
  subject: string
  html: string
}

// Initialisation lazy pour éviter les erreurs au build
let resendClient: Resend | null = null

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export async function sendMail({ to, subject, html }: MailOptions) {
  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || process.env.FROM_EMAIL || 'Cash360 <no-reply@cash360.finance>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      throw new Error(`Erreur envoi email: ${error.message}`)
    }

    console.log('Email envoyé avec succès:', data)
    return data
  } catch (error) {
    console.error('Erreur sendMail:', error)
    throw error
  }
}
