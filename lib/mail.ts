import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface MailOptions {
  to: string
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: MailOptions) {
  try {
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
