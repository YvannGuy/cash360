/**
 * Template newsletter Cash360
 * Template complet pour envoyer la newsletter à tous les utilisateurs
 */

export function generateNewsletterHtml(origin: string = 'https://cash360.finance'): string {
  const loginUrl = `${origin}/login`
  const dashboardUrl = `${origin}/dashboard`
  const boutiqueUrl = `${origin}/dashboard?tab=boutique`
  const formationsUrl = `${origin}/dashboard?tab=formations`
  const subscriptionUrl = `${origin}/dashboard?tab=boutique&category=abonnement`
  const contactEmail = 'Cash@cash360.finance'
  const cgvUrl = `${origin}/cgv`
  const mentionsUrl = `${origin}/mentions-legales`
  const privacyUrl = `${origin}/politique-de-confidentialite`
  
  // URLs des images
  const image1 = `${origin}/images/1.png` // Comment utiliser le site
  const image2 = `${origin}/images/2.png` // Créer un compte
  const image3 = `${origin}/images/3.png` // Tableau de bord
  const image4 = `${origin}/images/4.png` // Panier
  const image5 = `${origin}/images/5.png` // Mes achats
  const image6 = `${origin}/images/6.png` // Abonnement
  const image7 = `${origin}/images/7.png` // Contact

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter Cash360</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #012F4E 0%, #00A1C6 100%);
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            color: #FEBE02;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .tagline {
            color: #ffffff;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .section {
            padding: 40px 20px;
        }
        
        .section-dark {
            background-color: #012F4E;
            color: #ffffff;
        }
        
        .section-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .section-title-white {
            color: #ffffff;
        }
        
        .section-title-yellow {
            color: #FEBE02;
        }
        
        .section-subtitle {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .image-container {
            margin: 30px 0;
            text-align: center;
        }
        
        .image-container img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .cta-button {
            display: inline-block;
            background-color: #FEBE02;
            color: #012F4E;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            transition: background-color 0.3s;
        }
        
        .cta-button:hover {
            background-color: #e6a802;
        }
        
        .cta-button-blue {
            background-color: #00A1C6;
            color: #ffffff;
        }
        
        .cta-button-blue:hover {
            background-color: #0089a3;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .feature-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .feature-icon {
            font-size: 40px;
            margin-bottom: 15px;
        }
        
        .feature-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #012F4E;
        }
        
        .feature-description {
            font-size: 14px;
            color: #666;
        }
        
        .contact-section {
            background-color: #012F4E;
            padding: 40px 20px;
            text-align: center;
        }
        
        .contact-email {
            font-size: 20px;
            color: #FEBE02;
            text-decoration: none;
            font-weight: bold;
            display: block;
            margin: 20px 0;
        }
        
        .contact-email:hover {
            text-decoration: underline;
        }
        
        .footer {
            background-color: #012F4E;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            font-size: 12px;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            color: #FEBE02;
            text-decoration: none;
            margin: 0 10px;
        }
        
        .footer-links a:hover {
            text-decoration: underline;
        }
        
        .divider {
            height: 2px;
            background: linear-gradient(to right, transparent, #00A1C6, transparent);
            margin: 40px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .section {
                padding: 30px 15px;
            }
            
            .section-title {
                font-size: 24px;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">CASH360</div>
            <div class="tagline">La maîtrise de vos finances de A à Z</div>
        </div>
        
        <!-- Section 1: Comment utiliser le site -->
        <div class="section">
            <h2 class="section-title">Comment utiliser le site <span style="color: #FEBE02;">cash360?</span></h2>
            <p class="section-subtitle">Un guide pour créer un compte et profiter pleinement de la boutique.</p>
            <div class="image-container">
                <img src="${image1}" alt="Comment utiliser le site Cash360" />
            </div>
            <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">Créer mon compte</a>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Section 2: Créer un compte -->
        <div class="section section-dark">
            <h2 class="section-title section-title-white">Créer un compte en <span class="section-title-yellow">2 min</span></h2>
            <p class="section-subtitle" style="color: #ffffff;">Entrez vos informations : prénom, nom, ainsi que votre mot de passe.</p>
            <div class="image-container">
                <img src="${image2}" alt="Créer un compte Cash360" />
            </div>
            <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">Je m'inscris maintenant</a>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Section 3: Accéder au tableau de bord -->
        <div class="section">
            <h2 class="section-title">Accédez à <span style="color: #FEBE02;">votre tableau de bord</span></h2>
            <p class="section-subtitle">Vous y trouverez la boutique, avec les masterclasses, les coachings, et surtout l'abonnement, qui vous donne accès au tableau de bord complet</p>
            <div class="image-container">
                <img src="${image3}" alt="Tableau de bord Cash360" />
            </div>
            <div style="text-align: center;">
                <a href="${dashboardUrl}" class="cta-button">Accéder au tableau de bord</a>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Section 4: Outils exclusifs avec abonnement -->
        <div class="section section-dark">
            <h2 class="section-title section-title-white">Accédez à des outils exclusifs avec votre <span class="section-title-yellow">abonnement</span></h2>
            <p class="section-subtitle" style="color: #ffffff;">Retrouvez des outils tels que «Budget & suivi», «Jeûne financier» et «Debt Free» pour vous aider à gérer vos finances.</p>
            <div class="image-container">
                <img src="${image6}" alt="Outils exclusifs avec abonnement Cash360" />
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">💰</div>
                    <div class="feature-title">Budget & Suivi</div>
                    <div class="feature-description">Gérez vos finances mois par mois</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⛔</div>
                    <div class="feature-title">Jeûne Financier</div>
                    <div class="feature-description">Contrôlez vos dépenses impulsives</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-title">Debt Free</div>
                    <div class="feature-description">Libérez-vous de vos dettes</div>
                </div>
            </div>
            <div style="text-align: center;">
                <a href="${subscriptionUrl}" class="cta-button">Découvrir l'abonnement</a>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Section 5: Ajouter au panier -->
        <div class="section">
            <h2 class="section-title">Ajoutez vos achats <span style="color: #FEBE02;">au panier</span></h2>
            <p class="section-subtitle">Pour l'Europe, réglez via de nombreux moyens de paiement, et pour l'Afrique, payez par Mobile Money (Orange ou Wave).</p>
            <div class="image-container">
                <img src="${image4}" alt="Panier d'achat Cash360" />
            </div>
            <div style="text-align: center;">
                <a href="${boutiqueUrl}" class="cta-button">Voir la boutique</a>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Section 6: Mes achats -->
        <div class="section section-dark">
            <h2 class="section-title section-title-white">Retrouvez vos commandes dans <span class="section-title-yellow">"mes achats"</span></h2>
            <p class="section-subtitle" style="color: #ffffff;">Accédez facilement à vos commandes et retrouvez-y les liens vers les masterclasses et coachings !</p>
            <div class="image-container">
                <img src="${image5}" alt="Mes achats Cash360" />
            </div>
            <div style="text-align: center;">
                <a href="${formationsUrl}" class="cta-button">Voir mes achats</a>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Section Contact -->
        <div class="contact-section">
            <h2 class="section-title section-title-white">Vous avez des questions?</h2>
            <h3 class="section-title section-title-yellow" style="font-size: 24px; margin-bottom: 20px;">Contactez nous par mail</h3>
            <div class="image-container" style="margin-top: 30px;">
                <img src="${image7}" alt="Contact Cash360" />
            </div>
            <a href="mailto:${contactEmail}" class="contact-email">${contactEmail}</a>
            <p style="color: #ffffff; margin-top: 20px;">Nos équipes sont disponibles de 09h à 17h pour répondre à toutes vos questions</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-links">
                <a href="${cgvUrl}">CGV</a>
                <a href="${mentionsUrl}">Mentions légales</a>
                <a href="${privacyUrl}">Politique de confidentialité</a>
            </div>
            <p style="margin-top: 20px;">
                © 2024 Cash360. Tous droits réservés.<br>
                La maîtrise de vos finances de A à Z
            </p>
            <p style="margin-top: 15px; font-size: 11px; opacity: 0.8;">
                Vous recevez cet email car vous êtes inscrit à la newsletter Cash360.<br>
                <a href="#" style="color: #FEBE02;">Se désabonner</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}
