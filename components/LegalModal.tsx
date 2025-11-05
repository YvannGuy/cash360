'use client'

import { useEffect, useState } from 'react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'privacy' | 'legal' | 'terms'
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Politique de confidentialité — Cash360',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable du traitement</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le site www.cash360.finance est édité par Cash360, marque exploitée par Madame Myriam Mireille Zebaï KONAN, entrepreneure individuelle inscrite sous le SIREN 993 331 404, dont le siège est situé au 229 rue Saint-Honoré, 75001 Paris (France).
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  📧 Email de contact : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Données collectées</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Dans le cadre de l'utilisation du site et des services Cash360, les données suivantes peuvent être collectées :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Informations d'identité : nom, prénom, adresse e-mail, téléphone.</li>
                  <li>Informations de paiement : données nécessaires au règlement des services (via Stripe, PayPal ou autre prestataire sécurisé).</li>
                  <li>Documents transmis : relevés bancaires, budgets, ou fichiers relatifs à l'analyse financière.</li>
                  <li>Données de navigation : adresse IP, pages consultées, temps de connexion, cookies analytiques.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Ces données sont fournies volontairement par l'utilisateur lors d'une inscription, d'un achat ou d'un envoi de document.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Finalités du traitement</h3>
                <p className="text-gray-700 leading-relaxed mb-3">Les données collectées servent à :</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Gérer les comptes utilisateurs et les commandes sur la plateforme.</li>
                  <li>Fournir les services achetés : analyses financières, formations et capsules.</li>
                  <li>Suivre les rendez-vous et accompagnements.</li>
                  <li>Améliorer les parcours utilisateurs et la sécurité du site.</li>
                  <li>Communiquer par e-mail ou WhatsApp dans un cadre strictement lié aux services proposés.</li>
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Base légale du traitement</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le traitement repose sur :<br/>
                  • le consentement de l'utilisateur,<br/>
                  • l'exécution d'un contrat (achat de service ou formation),<br/>
                  • l'intérêt légitime de Cash360 à assurer la qualité et la sécurité de ses prestations.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Durée de conservation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les données sont conservées pour une durée maximale de 3 ans après la dernière interaction (commande, message ou connexion), sauf demande de suppression avant ce délai.
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  Les données liées à la facturation sont conservées conformément aux obligations comptables (10 ans).
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Sécurité des données</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cash360 applique des mesures techniques et organisationnelles strictes :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Hébergement sécurisé (Hostinger, serveurs européens).</li>
                  <li>Connexions chiffrées HTTPS / SSL.</li>
                  <li>Accès restreint aux seules personnes habilitées.</li>
                  <li>Sauvegardes régulières et audit de sécurité interne.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Aucune donnée n'est stockée ou traitée localement sans chiffrement.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Partage et transfert de données</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Vos données ne sont ni vendues ni cédées à des tiers.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Elles peuvent être partagées uniquement avec :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Les prestataires techniques nécessaires (hébergement, emailing, paiement).</li>
                  <li>Les autorités légales en cas d'obligation (fraude, contentieux, etc.).</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Aucun transfert hors Union européenne n'est réalisé sans garanties conformes au RGPD.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Vos droits</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Droit d'accès, de rectification, et de suppression.</li>
                  <li>Droit d'opposition et de limitation.</li>
                  <li>Droit à la portabilité de vos données.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Pour exercer vos droits, écrivez à <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a> en précisant l'objet de votre demande.
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  Une réponse vous sera adressée sous 30 jours.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Cookies</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Le site utilise des cookies à des fins :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>techniques (navigation et connexion),</li>
                  <li>analytiques (statistiques d'audience),</li>
                  <li>marketing (mesure de performance publicitaire).</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Vous pouvez à tout moment paramétrer ou refuser les cookies via votre navigateur.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Contact</h3>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question ou réclamation concernant la gestion de vos données personnelles :
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  📧 <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  📍 Cash360 — 229 rue Saint-Honoré, 75001 Paris, France
                </p>
              </div>
            </div>
          )
        }

      case 'legal':
        return {
          title: 'Mentions légales — Cash360',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Éditeur du site</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Le site www.cash360.finance est édité par
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>Cash360</strong><br/>
                  Entreprise individuelle dirigée par Madame Myriam Mireille Zebaï KONAN<br/>
                  Immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro SIREN 993 331 404
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Adresse : 229 rue Saint-Honoré, 75001 Paris, France<br/>
                  Email : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a><br/>
                  Site : <a href="https://www.cash360.finance" className="text-blue-600 hover:underline">www.cash360.finance</a>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Hébergeur du site</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Le site est hébergé par
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Hostinger International Ltd.</strong><br/>
                  61 Lordou Vironos Street, 6023 Larnaca, Chypre<br/>
                  Site web : <a href="https://www.hostinger.fr" className="text-blue-600 hover:underline">www.hostinger.fr</a><br/>
                  Email : <a href="mailto:support@hostinger.com" className="text-blue-600 hover:underline">support@hostinger.com</a>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Propriété intellectuelle</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  L'ensemble du contenu présent sur le site www.cash360.finance, notamment les textes, graphismes, logos, images, vidéos, icônes et documents téléchargeables, est la propriété exclusive de Cash360 sauf mention contraire.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Toute reproduction, représentation, modification, publication ou adaptation totale ou partielle du contenu, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de Cash360.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Toute exploitation non autorisée du site ou de son contenu est susceptible de constituer une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Activité</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cash360 est une plateforme d'éducation et d'analyse financière qui propose des analyses pédagogiques de relevés bancaires, des formations et capsules en ligne sur la gestion financière, l'épargne et la prospérité, ainsi que des accompagnements spirituels et financiers personnalisés.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Cash360 n'est pas une institution bancaire ni un établissement de crédit ou d'investissement.<br/>
                  Les services proposés sont strictement à but éducatif et informatif et ne constituent ni un conseil financier réglementé, ni une offre d'investissement.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Données personnelles</h3>
                <p className="text-gray-700 leading-relaxed">
                  La gestion des données personnelles est régie par la Politique de confidentialité, consultable à l'adresse suivante :<br/>
                  <a href="https://www.cash360.finance/politique-de-confidentialite" className="text-blue-600 hover:underline">www.cash360.finance/politique-de-confidentialite</a>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Responsabilité</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cash360 met tout en œuvre pour fournir des informations fiables et actualisées.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cependant, l'entreprise ne saurait être tenue responsable des erreurs, omissions ou inexactitudes présentes sur le site, d'une mauvaise interprétation des contenus fournis ou de tout dommage direct ou indirect résultant de l'utilisation du site.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  L'utilisateur demeure responsable de l'usage qu'il fait des informations et services proposés.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Liens externes</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le site peut contenir des liens hypertextes renvoyant vers d'autres sites tiers.<br/>
                  Cash360 décline toute responsabilité quant aux contenus ou pratiques de ces sites externes.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Accessibilité du site</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Le site www.cash360.finance est accessible 24h/24 et 7j/7, sauf en cas de maintenance technique ou de force majeure.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Cash360 s'engage à limiter la durée des interruptions dans la mesure du possible.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Droit applicable</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les présentes mentions légales sont régies par le droit français.<br/>
                  Tout litige relatif à leur interprétation ou à leur exécution relève des tribunaux compétents de Paris.
                </p>
              </div>
            </div>
          )
        }

      case 'terms':
        return {
          title: 'Conditions Générales de Vente (CGV) — Cash360',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Objet</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Les présentes Conditions Générales de Vente ont pour objet de définir les modalités de vente des prestations et produits proposés sur le site www.cash360.finance, édité par Cash360.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Toute commande passée sur le site implique l'acceptation pleine et entière des présentes CGV, qui prévalent sur tout autre document.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Prestations et produits</h3>
                <p className="text-gray-700 leading-relaxed mb-3">Cash360 propose :</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>des analyses financières pédagogiques à partir de relevés bancaires transmis par le client,</li>
                  <li>des capsules et formations numériques relatives à la gestion financière, à la prospérité et à l'éducation financière,</li>
                  <li>des séances d'accompagnement ou webinaires à visée éducative et spirituelle.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Les services proposés ne constituent ni un conseil financier réglementé, ni un service d'investissement, ni une activité bancaire au sens du Code monétaire et financier.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Commande</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Le client sélectionne le service ou produit souhaité (analyse, capsule ou formation) et procède à la commande via la boutique en ligne.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Toute commande est ferme et définitive après validation du paiement.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Cash360 se réserve le droit de refuser une commande en cas d'abus, de fraude ou de litige antérieur non résolu.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Tarifs et paiements</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Les prix affichés sur le site sont indiqués en euros toutes taxes comprises (TTC).
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">Les paiements peuvent être effectués :</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>par carte bancaire via Stripe (Visa, Mastercard, Apple Pay, etc.),</li>
                  <li>ou via Mobile Money / Wave / Orange Money pour les clients d'Afrique de l'Ouest et d'Afrique centrale.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3 mb-3">
                  En cas de paiement par Mobile Money, le client doit transmettre la preuve de paiement conformément aux instructions affichées sur le site.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  La commande ne sera validée qu'après réception effective du paiement.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Aucune donnée bancaire n'est stockée sur les serveurs de Cash360.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Livraison des prestations</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Pour l'analyse financière, le client reçoit son rapport personnalisé au format PDF sous 48 à 72 heures après validation du paiement et réception complète des documents demandés.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Pour les formations et capsules, l'accès est immédiat après validation du paiement via le compte utilisateur.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Droit de rétractation</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques fournis immédiatement après l'achat, ni aux prestations pleinement exécutées avant la fin du délai de rétractation avec l'accord préalable du client.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Ainsi, en commandant sur le site, le client reconnaît et accepte renoncer expressément à son droit de rétractation pour tout contenu numérique ou service fourni immédiatement.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Obligations du client</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Le client s'engage à fournir des informations exactes, complètes et à jour.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  En cas de transmission de relevés ou de documents, il garantit qu'ils lui appartiennent et qu'ils ne contiennent aucune donnée d'un tiers sans autorisation.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Tout usage frauduleux ou abusif du service pourra entraîner la suspension ou la suppression du compte utilisateur.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Responsabilité</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cash360 s'engage à réaliser les analyses et formations avec sérieux, pédagogie et confidentialité.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cependant, les résultats fournis ont une valeur informative et éducative, et ne constituent ni une garantie de performance, ni une recommandation d'investissement.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">Cash360 ne pourra être tenue responsable :</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>d'une mauvaise interprétation des conseils fournis,</li>
                  <li>d'une utilisation erronée des données transmises,</li>
                  <li>de tout dommage indirect, perte financière ou préjudice moral résultant de l'utilisation du service.</li>
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Confidentialité et données personnelles</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cash360 applique une politique stricte de protection des données, conformément au RGPD.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Toutes les informations collectées sont confidentielles et utilisées uniquement pour le traitement des commandes et le suivi client.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  La politique de confidentialité complète est consultable à l'adresse : <a href="https://www.cash360.finance/politique-de-confidentialite" className="text-blue-600 hover:underline">www.cash360.finance/politique-de-confidentialite</a>.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Propriété intellectuelle</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Les formations, capsules, analyses, textes, supports vidéo et graphiques sont la propriété exclusive de Cash360.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Toute reproduction, diffusion ou utilisation sans autorisation écrite préalable est strictement interdite.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Force majeure</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cash360 ne saurait être tenue responsable en cas de non-exécution de ses obligations due à un événement de force majeure (panne serveur, coupure internet, catastrophe naturelle, etc.).
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Litiges et droit applicable</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Les présentes CGV sont soumises au droit français.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  En cas de litige, le client doit adresser une réclamation écrite à <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  À défaut de résolution amiable, le différend sera porté devant les tribunaux compétents de Paris.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">13. Contact</h3>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Cash360</strong><br/>
                  229 rue Saint-Honoré, 75001 Paris<br/>
                  Email : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a><br/>
                  Site : <a href="https://www.cash360.finance" className="text-blue-600 hover:underline">www.cash360.finance</a>
                </p>
              </div>
            </div>
          )
        }

      default:
        return { title: '', content: null }
    }
  }

  const { title, content } = getContent()

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${type === 'privacy' || type === 'legal' || type === 'terms' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' : 'text-white'}`}>{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {content}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
