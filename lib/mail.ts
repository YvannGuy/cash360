import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

export interface MailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content?: Buffer | string
    path?: string
  }>
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

export async function sendMail({ to, subject, html, attachments }: MailOptions) {
  try {
    const resend = getResendClient()
    
    // Préparer les pièces jointes si présentes
    const emailAttachments = attachments?.map(att => {
      let contentBase64: string
      
      if (att.content) {
        // Si c'est déjà une string, on assume que c'est déjà en base64
        // Sinon si c'est un Buffer, on le convertit en base64
        if (Buffer.isBuffer(att.content)) {
          contentBase64 = att.content.toString('base64')
        } else {
          contentBase64 = att.content
        }
      } else if (att.path) {
        // Lire le fichier depuis le système de fichiers et le convertir en base64
        const filePath = path.join(process.cwd(), att.path)
        const fileBuffer = fs.readFileSync(filePath)
        contentBase64 = fileBuffer.toString('base64')
      } else {
        throw new Error(`Attachment ${att.filename} must have either content or path`)
      }
      
      return {
        filename: att.filename,
        content: contentBase64,
      }
    })

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || process.env.FROM_EMAIL || 'Cash360 <no-reply@cash360.finance>',
      to: [to],
      subject,
      html,
      attachments: emailAttachments,
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
