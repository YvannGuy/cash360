import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'
import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Désactiver le body parser pour FormData
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extraire les données
    const orderId = formData.get('orderId') as string
    const productName = formData.get('productName') as string
    const cartItemsJson = formData.get('cartItems') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const msisdn = formData.get('msisdn') as string
    const operator = formData.get('operator') as string
    const amountFcfa = parseFloat(formData.get('amountFcfa') as string)
    const txRef = formData.get('txRef') as string | null
    const file = formData.get('file') as File

    // Validations
    if (!orderId || !productName || !name || !email || !msisdn || !operator || !amountFcfa || !file) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Parser les cartItems
    let cartItems: Array<{ id: string; title: string; price: number; quantity: number; category?: string }> = []
    try {
      if (cartItemsJson) {
        cartItems = JSON.parse(cartItemsJson)
      }
    } catch (parseError) {
      console.error('Erreur parsing cartItems:', parseError)
      // On continue avec cartItems vide, on créera une commande avec le productName
    }

    // Vérifier l'opérateur
    if (operator !== 'orange_money' && operator !== 'wave' && operator !== 'congo_mobile_money') {
      return NextResponse.json(
        { error: 'Opérateur invalide' },
        { status: 400 }
      )
    }

    // Vérifier le fichier
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo)' },
        { status: 400 }
      )
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non autorisé (PDF, PNG, JPG uniquement)' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileUuid = uuidv4()
    const fileName = `${fileUuid}.${fileExt}`
    const filePath = `proofs/${orderId}/${fileName}`

    // Convertir File en Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Vérifier si le bucket proofs existe
    const { data: buckets, error: bucketsError } = await supabaseAdmin!.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Erreur listing buckets:', bucketsError)
      return NextResponse.json(
        { error: 'Erreur de configuration du stockage' },
        { status: 500 }
      )
    }

    const proofsBucket = buckets?.find(bucket => bucket.name === 'proofs')
    
    if (!proofsBucket) {
      // Créer le bucket proofs s'il n'existe pas (privé)
      console.log('Création du bucket "proofs"...')
      const { error: createError } = await supabaseAdmin!.storage.createBucket('proofs', {
        public: false, // Bucket privé
        fileSizeLimit: 10485760, // 10MB max
        allowedMimeTypes: allowedTypes
      })

      if (createError) {
        console.error('Erreur création bucket:', createError)
        return NextResponse.json(
          { error: 'Erreur de configuration du stockage' },
          { status: 500 }
        )
      }

      console.log('Bucket "proofs" créé avec succès')
    }

    // Upload du fichier
    const { data: uploadData, error: uploadError } = await supabaseAdmin!.storage
      .from('proofs')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload preuve:', uploadError)
      return NextResponse.json(
        { error: `Erreur lors de l'upload du fichier: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('Preuve uploadée avec succès:', filePath)

    // Calculer le montant en EUR
    const amountEUR = amountFcfa / 655.96 // Taux fixe de conversion

    // Récupérer le user_id depuis la session ou l'email
    let userId: string | null = null
    
    // D'abord, essayer de récupérer depuis la session si l'utilisateur est connecté
    try {
      const cookieStore = await cookies()
      const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options)
                })
              } catch (error) {
                // Ignore
              }
            },
          },
        }
      )
      
      const { data: { user: sessionUser }, error: sessionError } = await supabaseClient.auth.getUser()
      if (!sessionError && sessionUser) {
        userId = sessionUser.id
        console.log('[MOBILE-MONEY] Utilisateur trouvé depuis la session:', userId)
      }
    } catch (sessionError) {
      console.warn('[MOBILE-MONEY] Erreur récupération session:', sessionError)
    }
    
    // Si pas trouvé dans la session, chercher par email
    if (!userId) {
      try {
        const { data: usersData, error: usersError } = await supabaseAdmin!.auth.admin.listUsers()
        
        if (!usersError && usersData && usersData.users) {
          const user = usersData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
          if (user) {
            userId = user.id
            console.log('[MOBILE-MONEY] Utilisateur trouvé par email:', userId)
          } else {
            console.warn('[MOBILE-MONEY] Utilisateur non trouvé pour email:', email)
          }
        }
      } catch (userError: any) {
        console.error('[MOBILE-MONEY] Erreur récupération utilisateur:', userError)
      }
    }
    
    if (!userId) {
      console.error('[MOBILE-MONEY] ❌ Aucun user_id trouvé!')
      console.error('[MOBILE-MONEY] Email fourni:', email)
      console.error('[MOBILE-MONEY] La commande sera créée avec user_id null.')
      console.error('[MOBILE-MONEY] ⚠️ L\'utilisateur devra être mis à jour manuellement.')
      
      // Essayer une dernière fois avec l'email exact
      try {
        const { data: usersData, error: usersError } = await supabaseAdmin!.auth.admin.listUsers()
        if (!usersError && usersData && usersData.users) {
          console.log('[MOBILE-MONEY] Tous les utilisateurs disponibles:', usersData.users.map((u: any) => ({ id: u.id, email: u.email })))
          const user = usersData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
          if (user) {
            userId = user.id
            console.log('[MOBILE-MONEY] ✅ Utilisateur trouvé au dernier essai:', userId)
          }
        }
      } catch (finalError) {
        console.error('[MOBILE-MONEY] Erreur dernière tentative:', finalError)
      }
    }

    // Créer une commande par produit dans le panier
    const orderEntries = []
    
    if (cartItems && cartItems.length > 0) {
      // Calculer le montant par produit (proportionnel)
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const amountPerProduct = amountEUR / totalPrice
      
      // Créer une commande pour chaque produit
      for (const item of cartItems) {
        const itemAmount = (item.price * item.quantity) * amountPerProduct
        const itemAmountFcfa = Math.round(itemAmount * 655.96)
        
        // Récupérer le nom du produit depuis la DB si possible
        let productNameFinal = item.title
        if (item.category === 'abonnement') {
          productNameFinal = `${productNameFinal} (Abonnement)`
        }
        try {
          const { data: product } = await supabaseAdmin!
            .from('products')
            .select('name')
            .eq('id', item.id)
            .single()
          
          if (product) {
            productNameFinal = product.name || item.title
          }
        } catch (err) {
          // Utiliser le titre si le produit n'est pas trouvé
          productNameFinal = item.title
        }
        
        const orderEntry = {
          user_id: userId,
          product_id: item.id, // Utiliser le vrai product_id
          product_name: productNameFinal,
          amount: itemAmount,
          amount_fcfa: itemAmountFcfa,
          payment_method: 'mobile_money',
          status: 'pending_review',
          operator: operator,
          msisdn: msisdn,
          tx_ref: txRef || null,
          proof_path: filePath,
          transaction_id: `${orderId}-${item.id}`
        }
        
        orderEntries.push(orderEntry)
      }
    } else {
      // Fallback : si pas de cartItems, créer une commande avec le productName
      const productId = productName.toLowerCase().replace(/\s+/g, '-').substring(0, 100)
      const orderEntry = {
        user_id: userId,
        product_id: productId,
        product_name: productName,
        amount: amountEUR,
        amount_fcfa: amountFcfa,
        payment_method: 'mobile_money',
        status: 'pending_review',
        operator: operator,
        msisdn: msisdn,
        tx_ref: txRef || null,
        proof_path: filePath,
        transaction_id: orderId
      }
      orderEntries.push(orderEntry)
    }

    console.log(`[MOBILE-MONEY] Création de ${orderEntries.length} commande(s) Mobile Money:`, orderEntries)
    console.log(`[MOBILE-MONEY] user_id utilisé:`, userId)
    console.log(`[MOBILE-MONEY] Opérateur:`, operator)
    console.log(`[MOBILE-MONEY] Détails orderEntries:`, JSON.stringify(orderEntries, null, 2))

    // Insérer toutes les commandes
    if (orderEntries.length > 0) {
      const { data: createdOrders, error: orderError } = await supabaseAdmin!
        .from('orders')
        .insert(orderEntries)
        .select()

      if (orderError) {
        console.error('[MOBILE-MONEY] ❌ Erreur création commandes:', orderError)
        console.error('[MOBILE-MONEY] Détails erreur:', JSON.stringify(orderError, null, 2))
        // On continue quand même, la preuve est uploadée
      } else {
        console.log(`[MOBILE-MONEY] ✅ ${createdOrders?.length || 0} commande(s) créée(s) avec succès`)
        console.log(`[MOBILE-MONEY] Détails commandes créées:`, createdOrders?.map((o: any) => ({ 
          id: o.id, 
          product_id: o.product_id, 
          user_id: o.user_id, 
          status: o.status,
          operator: o.operator,
          payment_method: o.payment_method
        })))
      }
    } else {
      console.warn('[MOBILE-MONEY] ⚠️ Aucune commande à créer (orderEntries vide)')
    }

    // Générer les emails
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Email admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle preuve Mobile Money</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0B1B2B; border-bottom: 3px solid #FEBE02; padding-bottom: 10px;">
            Nouvelle preuve Mobile Money reçue
          </h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0B1B2B;">Informations du client</h3>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Téléphone :</strong> ${msisdn}</p>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0B1B2B;">Détails du paiement</h3>
            <p><strong>Référence commande :</strong> C360-AFRIQUE</p>
            <p><strong>Produit :</strong> ${productName}</p>
            <p><strong>Montant :</strong> € ${amountEUR.toFixed(2)} (${amountFcfa.toLocaleString('fr-FR')} FCFA)</p>
            <p><strong>Opérateur :</strong> ${operator === 'orange_money' ? 'Orange Money' : operator === 'wave' ? 'Wave' : 'Mobile Money RDC'}</p>
            ${txRef ? `<p><strong>Référence transaction :</strong> ${txRef}</p>` : ''}
          </div>
          
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0B1B2B;">Preuve</h3>
            <p>Fichier : ${file.name}</p>
            <p>Chemin : ${filePath}</p>
          </div>
          
          <p style="margin-top: 30px; padding: 15px; background: #fff3e0; border-radius: 8px;">
            <strong>Action requise :</strong> Veuillez vérifier la preuve et valider la commande si tout est correct.
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Cet email a été envoyé automatiquement par le système Cash360.
          </p>
        </div>
      </body>
      </html>
    `

    try {
      await sendMail({
        to: process.env.MAIL_ADMIN || 'cash@cash360.finance',
        subject: `Nouvelle preuve Mobile Money – C360-AFRIQUE`,
        html: adminEmailHtml
      })
      console.log('Email admin envoyé')
    } catch (emailError: any) {
      console.error('Erreur envoi email admin:', emailError)
      // On continue quand même
    }

    // Attendre 1s avant l'email client
    await delay(1000)

    // Email client
    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preuve de paiement reçue</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0B1B2B; border-bottom: 3px solid #FEBE02; padding-bottom: 10px;">
            Merci pour votre paiement Mobile Money !
          </h2>
          
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 18px; margin: 0;">
              Nous avons bien reçu votre preuve de paiement pour la référence <strong>C360-AFRIQUE</strong>.
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0B1B2B;">Détails de votre commande</h3>
            <p><strong>Produit :</strong> ${productName}</p>
            <p><strong>Montant :</strong> € ${amountEUR.toFixed(2)} (${amountFcfa.toLocaleString('fr-FR')} FCFA)</p>
            <p><strong>Opérateur :</strong> ${operator === 'orange_money' ? 'Orange Money' : operator === 'wave' ? 'Wave' : 'Mobile Money RDC'}</p>
            <p><strong>Référence :</strong> C360-AFRIQUE</p>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FEBE02;">
            <p style="margin: 0; font-size: 16px;">
              <strong>⏱️ Délai de validation :</strong> Votre paiement sera validé dans un délai maximum de <strong>24 heures ouvrées</strong>.
            </p>
          </div>
          
          <p style="margin-top: 20px;">
            Vous recevrez une confirmation par email une fois le paiement validé.
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Cet email est un accusé de réception. Veuillez le conserver pour référence.
          </p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
            Cash360 – Paiement Mobile Money
          </p>
        </div>
      </body>
      </html>
    `

    try {
      await sendMail({
        to: email,
        subject: `Preuve reçue – C360-AFRIQUE (Validation sous 24h)`,
        html: clientEmailHtml
      })
      console.log('Email client envoyé')
    } catch (emailError: any) {
      console.error('Erreur envoi email client:', emailError)
      // On continue quand même
    }

    // Vérifier que les commandes Congo ont bien été créées
    if (operator === 'congo_mobile_money') {
      const { data: congoOrders, error: congoCheckError } = await supabaseAdmin!
        .from('orders')
        .select('*')
        .eq('operator', 'congo_mobile_money')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('[MOBILE-MONEY] 🔍 Vérification commandes Congo après création:', {
        count: congoOrders?.length || 0,
        orders: congoOrders?.map((o: any) => ({
          id: o.id,
          operator: o.operator,
          status: o.status,
          product_id: o.product_id,
          created_at: o.created_at
        })),
        error: congoCheckError
      })
    }

    return NextResponse.json({ 
      ok: true,
      orderId,
      message: 'Preuve envoyée avec succès'
    })

  } catch (error: any) {
    console.error('Erreur API mobile-money/submit:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

