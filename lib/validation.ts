import { z } from 'zod'

// Types de fichiers autorisés
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo

export const paymentMethodSchema = z.enum(['virement', 'paypal'])

export const clientInfoSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  email: z.string().email('Adresse email invalide'),
  telephone: z.string().optional(),
  message: z.string().max(500, 'Le message ne peut pas dépasser 500 caractères').optional(),
  paymentMethod: paymentMethodSchema,
  consentement: z.boolean().refine(val => val === true, 'Vous devez accepter le traitement de vos données'),
})

export const uploadSchema = z.object({
  files: z.array(z.instanceof(File))
    .min(3, 'Vous devez téléverser exactement 3 relevés')
    .max(3, 'Vous ne pouvez téléverser que 3 relevés maximum')
    .refine(
      files => files.every(file => ALLOWED_FILE_TYPES.includes(file.type)),
      'Seuls les fichiers PDF, PNG et JPG sont autorisés'
    )
    .refine(
      files => files.every(file => file.size <= MAX_FILE_SIZE),
      'Chaque fichier ne peut pas dépasser 10 Mo'
    ),
  virementJustificatif: z.instanceof(File).optional(),
})

export type ClientInfo = z.infer<typeof clientInfoSchema>
export type UploadData = z.infer<typeof uploadSchema>

// Validation côté serveur pour les fichiers
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux (max 10 Mo)' }
  }
  
  return { valid: true }
}
