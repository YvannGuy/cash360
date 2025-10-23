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
          title: 'Politique de confidentialité (RGPD)',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable du traitement</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le site www.cash360.finance est édité par Cash360, représenté par Pasteur Myriam Konan.<br/>
                  Email de contact : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Données collectées</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Lors de votre utilisation du site, Cash360 peut collecter les données suivantes :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Informations d'identité : nom, prénom, adresse e-mail, téléphone</li>
                  <li>Informations financières nécessaires à l'analyse (relevés bancaires, budgets)</li>
                  <li>Données de navigation (cookies, pages consultées, durée de session)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Ces données sont transmises volontairement par l'utilisateur lors de la prise de rendez-vous, du paiement ou de l'envoi de documents.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Finalités du traitement</h3>
                <p className="text-gray-700 leading-relaxed mb-3">Les données sont utilisées pour :</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Gérer les rendez-vous et échanges avec les clients</li>
                  <li>Réaliser les analyses financières personnalisées</li>
                  <li>Assurer le suivi des prestations</li>
                  <li>Améliorer l'expérience utilisateur et la sécurité du site</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Base légale</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le traitement repose sur :<br/>
                  • le consentement de l'utilisateur,<br/>
                  • l'exécution d'un contrat (analyse ou accompagnement financier)
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Durée de conservation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les données sont conservées pour une durée maximale de 3 ans à compter du dernier contact, sauf demande de suppression préalable.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Sécurité des données</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cash360 applique des mesures techniques et organisationnelles strictes afin d'assurer la confidentialité et la sécurité des données :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>hébergement sécurisé (Hostinger)</li>
                  <li>connexions chiffrées (HTTPS)</li>
                  <li>accès restreint aux seules personnes autorisées</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Partage des données</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les données ne sont jamais vendues ni partagées à des tiers, sauf :<br/>
                  • aux prestataires nécessaires au bon fonctionnement du service (hébergement, paiement, e-mailing)<br/>
                  • aux autorités compétentes en cas d'obligation légale
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Droits des utilisateurs</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>droit d'accès, de rectification et de suppression</li>
                  <li>droit d'opposition et de limitation</li>
                  <li>droit à la portabilité des données</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Pour exercer vos droits : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Cookies</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le site utilise des cookies pour des besoins de mesure d'audience et d'amélioration de navigation.<br/>
                  Vous pouvez refuser ces cookies via les paramètres de votre navigateur.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Contact</h3>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question relative à la gestion de vos données :<br/>
                  <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>
                </p>
              </div>
            </div>
          )
        }

      case 'legal':
        return {
          title: 'Mentions légales',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Éditeur du site</h3>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Cash360</strong><br/>
                  Représenté par : Pasteur Myriam Konan<br/>
                  Email : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a><br/>
                  Site : <a href="https://www.cash360.finance" className="text-blue-600 hover:underline">https://www.cash360.finance</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hébergeur</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le site est hébergé par Hostinger International Ltd.<br/>
                  Site : <a href="https://www.hostinger.fr" className="text-blue-600 hover:underline">https://www.hostinger.fr</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Directeur de publication</h3>
                <p className="text-gray-700 leading-relaxed">Pasteur Myriam Konan</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Propriété intellectuelle</h3>
                <p className="text-gray-700 leading-relaxed">
                  L'ensemble des contenus du site (textes, visuels, graphismes, logo, structure) sont la propriété exclusive de Cash360.<br/>
                  Toute reproduction ou utilisation sans autorisation écrite est interdite.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsabilité</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cash360 s'efforce de maintenir des informations exactes et à jour, mais ne saurait être tenue responsable d'éventuelles erreurs ou omissions.<br/>
                  Les informations proposées ne remplacent pas une consultation bancaire ou juridique personnalisée.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Loi applicable</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le présent site est régi par la loi française.<br/>
                  En cas de litige, les tribunaux compétents seront ceux du ressort de Paris (France).
                </p>
              </div>
            </div>
          )
        }

      case 'terms':
        return {
          title: 'Conditions Générales de Vente (CGV)',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Objet</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les présentes conditions générales de vente (CGV) régissent les services proposés par Cash360 sur le site www.cash360.finance :
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mt-3">
                  <li>consultations financières individuelles (Zoom)</li>
                  <li>analyses de relevés bancaires</li>
                  <li>accompagnements financiers personnalisés (Starter, Booster, Premium)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Tarifs et paiement</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les prix sont indiqués en euros TTC.<br/>
                  Le paiement est exigé à la commande, via les moyens proposés sur le site (virement, PayPal, carte bancaire).<br/>
                  Après paiement, le client dispose d'un délai de rétractation de 48 heures.<br/>
                  Passé ce délai, la commande devient ferme et non remboursable, sauf cas de force majeure.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Livraison des services</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les analyses et prestations sont effectuées dans les 48 à 72 heures ouvrées suivant la réception des documents.<br/>
                  Les rapports sont transmis par voie électronique à l'adresse e-mail fournie par le client.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Droit de rétractation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Conformément à l'article L221-18 du Code de la consommation, le client dispose d'un délai de 48 heures à compter du paiement pour se rétracter.<br/>
                  Toute demande doit être adressée à : <a href="mailto:cash@cash360.finance" className="text-blue-600 hover:underline">cash@cash360.finance</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Responsabilité</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les conseils fournis par Cash360 sont à vocation éducative et informative.<br/>
                  Le client demeure responsable de ses décisions financières et de l'utilisation des recommandations proposées.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Confidentialité</h3>
                <p className="text-gray-700 leading-relaxed">
                  Toutes les informations communiquées par le client (relevés bancaires, budgets, échanges) sont strictement confidentielles.<br/>
                  Elles sont stockées sur un espace sécurisé (Hostinger) et supprimées au plus tard 3 ans après la fin de la prestation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Force majeure</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cash360 ne pourra être tenu responsable de retards ou d'impossibilités d'exécution liés à un cas de force majeure (panne, coupure réseau, incident technique…).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Droit applicable et juridiction compétente</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les présentes CGV sont régies par le droit français.<br/>
                  Tout différend sera soumis aux tribunaux de Paris (France).
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {content}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
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
