import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import { Readable } from 'stream'

// Initialiser l'authentification Google Drive
let drive: any
let auth: JWT

function getGoogleDriveAuth() {
  if (!auth) {
    // Utiliser les credentials directement depuis les variables d'environnement
    const credentials = {
      type: "service_account",
      project_id: "cash360",
      private_key_id: "65252913f8c29324f50d5245424dfd51fe92407f",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDH/UHxGIIB+ZnI\nUnQH8elciYXWGxY//OUmYt43QXtbt/5a4oxJwbS1EJGUfLqdtg1FOEErdD2RBnRY\nIiaL7N6JN+fgeojMlwGBHRnTUqOvTd2v7LF1RMEqCKJtx+JcG8jq3GArOpJKQVjH\n+OyDUz+3h2bKVXyPvbJXvMkM9JnLB77XHou3V1aVYkFBElL1EHXA/6/JJeuSxQ8X\nUBOMnIT0QHjDrmjcx6IYup8NVpISsGGuV6gH5Kh4yDSiqA+K6Cnstskg5ciCWHhN\nI+ALqN6TLrHqiQWghvoMAyUTFEfbmDxVNDwrtTUySfkxprcXghLYYe8bxeb3/S1i\neN9ox9npAgMBAAECggEAMZZwVVGYWtkC8pLPRnELRfCriM0qlS8luoDlTJol9jYH\nEY+7wLixcqX7lOHCjfrznAGaLnn0h/hlUDSgft3qlp8WkLHzMLckqEemDFzeLI7\n97Uew08K/lspu0LGs8QH64Q9LDrXryXI17y3GFD6CY2/RQgxXIrSv8KFr3qu75JJ\nksrzFyTucykgmOW/5M9gaFfLmr9hbBfLnzEPIWa1sWfxQep4Clh3DTaE4PgPjU+W\nLGf48TPMZlnaUq2xpSZ1Wdf/LSOPiqqMGGHK+uCYbGWUmyJ3SaRr9oce8/bIvfRS\nfyb0h5P4s6cgIgrHHAyseVf9LC+cNFZg3Yug1QbbCQKBgQDzfrN8BixRMi/0Be0b\nWU41z905c2x3/uZyz5nW2RS5p1d7Z92lyqDC85pPehr+H5Jw6rSdnkri3Zqzvosb\nRETLJGTY0EdDVx/8iVKsCEB55SZDbKkI67YWdGaHuWYvdmzrJgAlYSUUDdZ1qai3\nnbdhyCsTF6eLNo0kPYCg/Z6nvwKBgQDSQpM8RiLV31fs+YJnjegqdUZRnq5DeUIF\nkDNJO+4E9Sq8XEra4L1kthGAMxaERMxoHY66fZCcA37oozT9Tiq4KkGaB2pNHPI9\npgtQO9AwzXIv5/nZKfdVqqgnlscR3Ij7feMGVfoFvJK1tF9Gi0gttR5GelK30mk+\nHCvY9BkoVwKBgQDS2Q43AWlyzhC0MEWHfye4dUzNqONubS3EkXxXjRbjRML+O4y1\nOedHqYYf+E5Ta6d1W+gW7LFQDjEeIIt4iv8/IT6qeICdEV7DYW5TRbn/U6x0ii09\nak781sLKGIMh6lyaqwdJVvuyh+EDdmyAw3O+moSiPcN5Sz2g+hjeT4AJJQKBgE67\nFx7OtGSZSPc3Rpk4DeM4HqiZXm9tjEdBA7M8eZfppaL6fB0RYlm/wzXZ62iDynaB\n+tviALAqru61jjX7ewuS5xWiCS/u0tY6wqm8e+yKQWOm3Wtvx2mQiX6pesk5ZyGk\ntcm9j+1t+xGHBNYJeGLEDF4fl7G1XCshqVmHrZPpAoGAWtKPuak8o2RummdT7Bf1\nMxgoS7kT5vFNPmf1EH+7gS+r1lbGtXD7+QPFRF8hTUJUnpw07Q1d3MpaGeo/KSqZ\ndJzI+6MkJVVoNf4+AFkjC7FnvHe1Ul4EHM5xcZCYXijJyK4ja5gUPbzzrBIglY+a\n/zgTph/e5RPOOCmJ0gAHnw4=\n-----END PRIVATE KEY-----\n",
      client_email: "cash360-drive-service@cash360.iam.gserviceaccount.com",
      client_id: "115494740424905278400",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/cash360-drive-service%40cash360.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    }
    
    auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive']
    })
  }
  return auth
}

function getGoogleDriveClient() {
  if (!drive) {
    const authClient = getGoogleDriveAuth()
    drive = google.drive({ version: 'v3', auth: authClient })
  }
  return drive
}

// Créer un dossier dans Google Drive
export async function createFolder(folderName: string, parentId?: string): Promise<string> {
  const driveClient = getGoogleDriveClient()
  try {
    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }
    if (parentId) {
      fileMetadata.parents = [parentId]
    }
    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    })
    return response.data.id!
  } catch (error) {
    console.error('Erreur création dossier:', error)
    throw new Error('Impossible de créer le dossier dans Google Drive')
  }
}

// Uploader un fichier vers Google Drive
export async function uploadFileToDrive(
  file: File,
  folderId: string,
  fileName: string
): Promise<string> {
  const driveClient = getGoogleDriveClient()
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const stream = Readable.from(buffer) // Utiliser Readable.from pour le body
    
    const response = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: file.type,
        body: stream // Utiliser Readable.from pour le body
      },
      fields: 'id'
    })

    return response.data.id!
  } catch (error) {
    console.error('Erreur upload fichier:', error)
    throw new Error(`Impossible d'uploader le fichier ${fileName}`)
  }
}

// Créer un lien de partage pour un fichier
export async function createShareableLink(fileId: string): Promise<string> {
  const driveClient = getGoogleDriveClient()
  try {
    // Rendre le fichier partageable
    await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Obtenir les informations du fichier pour le lien webViewLink
    const response = await driveClient.files.get({
      fileId: fileId,
      fields: 'webViewLink',
    })

    return response.data.webViewLink!
  } catch (error) {
    console.error('Erreur création lien de partage:', error)
    throw new Error(`Impossible de créer le lien de partage pour le fichier ${fileId}`)
  }
}

// Fonction principale pour uploader les relevés
export async function uploadRelevesToDrive(relevesFiles: File[], ticket: string): Promise<{ [key: string]: string }> {
  const driveClient = getGoogleDriveClient()
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  
  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not defined in environment variables.')
  }

  // Créer un dossier pour le ticket
  const ticketFolderName = `Ticket-${ticket}`
  const ticketFolderId = await createFolder(ticketFolderName, parentFolderId)

  const uploadedLinks: { [key: string]: string } = {}

  for (let i = 0; i < relevesFiles.length; i++) {
    const file = relevesFiles[i]
    const fileName = `releve_${i + 1}_${file.name}`
    const fileId = await uploadFileToDrive(file, ticketFolderId, fileName)
    const shareableLink = await createShareableLink(fileId)
    uploadedLinks[`releve_${i + 1}`] = shareableLink
  }

  return uploadedLinks
}