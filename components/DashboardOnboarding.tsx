'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface DashboardOnboardingProps {
  userId?: string | null
}

export default function DashboardOnboarding({ userId }: DashboardOnboardingProps) {
  const { t } = useLanguage()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  // Mettre à jour la taille de la fenêtre
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    window.addEventListener('orientationchange', updateViewportSize)
    
    return () => {
      window.removeEventListener('resize', updateViewportSize)
      window.removeEventListener('orientationchange', updateViewportSize)
    }
  }, [])

  useEffect(() => {
    // Ne pas afficher l'onboarding si pas d'utilisateur
    if (!userId) return
    
    // Vérifier si l'onboarding a déjà été vu par CET utilisateur spécifique
    const onboardingSeen = localStorage.getItem(`dashboard_onboarding_seen_${userId}`)
    if (!onboardingSeen) {
      // Attendre que le DOM soit prêt
      setTimeout(() => {
        setShowOnboarding(true)
      }, 1000)
    }
  }, [userId])

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: t.dashboard?.onboarding?.welcome?.title || '👋 Bienvenue sur Cash360 !',
      description: t.dashboard?.onboarding?.welcome?.description || 'Découvrez votre espace personnel Cash360. Ce guide rapide vous présentera les fonctionnalités essentielles pour bien démarrer votre transformation financière.',
      position: 'bottom'
    },
    {
      id: 'tabs',
      title: t.dashboard?.onboarding?.tabs?.title || '📑 Les onglets principaux',
      description: t.dashboard?.onboarding?.tabs?.description || 'Naviguez facilement entre les différents onglets : Boutique pour découvrir nos produits, Mes achats pour accéder à vos formations, et Profil pour gérer votre compte.',
      targetSelector: '[data-onboarding="tabs"]',
      position: 'bottom'
    },
    {
      id: 'boutique',
      title: t.dashboard?.onboarding?.boutique?.title || '🛍️ La Boutique',
      description: t.dashboard?.onboarding?.boutique?.description || 'Explorez nos produits pour votre développement financier : capsules d\'enseignement, analyses financières personnalisées, packs de formations, ebooks pratiques et l\'abonnement premium Sagesse de Salomon.',
      targetSelector: '[data-onboarding="boutique-tab"]',
      position: 'bottom'
    },
    {
      id: 'categories',
      title: t.dashboard?.onboarding?.categories?.title || '🏷️ Filtrer par catégorie',
      description: t.dashboard?.onboarding?.categories?.description || 'Utilisez les filtres pour afficher uniquement la catégorie qui vous intéresse : Capsules, Analyse financière, Pack, Ebook ou Abonnement. Cliquez sur un filtre pour voir les produits correspondants.',
      targetSelector: '[data-onboarding="categories"]',
      position: 'top'
    },
    {
      id: 'purchases',
      title: t.dashboard?.onboarding?.purchases?.title || '📦 Mes achats',
      description: t.dashboard?.onboarding?.purchases?.description || 'Retrouvez tous vos achats ici : téléchargez vos PDF, accédez à vos analyses financières, consultez vos formations et gérez votre abonnement. Tout est centralisé dans cet onglet !',
      targetSelector: '[data-onboarding="purchases-tab"]',
      position: 'bottom'
    },
    {
      id: 'cart',
      title: t.dashboard?.onboarding?.cart?.title || '🛒 Le panier',
      description: t.dashboard?.onboarding?.cart?.description || 'Ajoutez des produits à votre panier en cliquant sur "Ajouter au panier". Cliquez ensuite sur l\'icône du panier en haut à droite pour voir vos articles, modifier les quantités et finaliser votre commande.',
      targetSelector: '[data-onboarding="cart"]',
      position: 'left'
    },
    {
      id: 'profile',
      title: t.dashboard?.onboarding?.profile?.title || '👤 Profil',
      description: t.dashboard?.onboarding?.profile?.description || 'Gérez vos informations personnelles, changez votre devise et votre langue, et consultez l\'état de votre abonnement depuis l\'onglet Profil. C\'est votre espace de paramétrage personnel.',
      targetSelector: '[data-onboarding="profile-tab"]',
      position: 'bottom'
    },
    {
      id: 'complete',
      title: t.dashboard?.onboarding?.complete?.title || '✅ Parfait, vous êtes prêt !',
      description: t.dashboard?.onboarding?.complete?.description || 'Vous connaissez maintenant les bases de votre dashboard Cash360. Explorez la boutique, découvrez nos formations et commencez votre parcours vers une vie financière équilibrée. Besoin d\'aide ? Contactez-nous via WhatsApp en bas à droite !',
      position: 'bottom'
    }
  ], [t])

  useEffect(() => {
    if (!showOnboarding || currentStep >= steps.length) return

    const step = steps[currentStep]
    
    // Fonction pour trouver et positionner l'élément
    const findAndPositionElement = (attempts = 0) => {
      if (step.targetSelector) {
        const element = document.querySelector(step.targetSelector) as HTMLElement
        if (element) {
          setHighlightedElement(element)
          
          // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const rect = element.getBoundingClientRect()
              
              // Vérifier que l'élément est visible
              if (rect.width === 0 && rect.height === 0 && attempts < 5) {
                setTimeout(() => findAndPositionElement(attempts + 1), 200)
                return
              }
              
              // Scroll vers l'élément avec scrollIntoView (plus fiable)
              // Utiliser 'nearest' pour éviter les scrolls inutiles
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
              
              // Pour les éléments dans un conteneur scrollable horizontal (comme les onglets)
              // Trouver le conteneur parent scrollable et scroller si nécessaire
              let parent = element.parentElement
              while (parent) {
                const style = window.getComputedStyle(parent)
                if (style.overflowX === 'auto' || style.overflowX === 'scroll' || 
                    style.overflow === 'auto' || style.overflow === 'scroll') {
                  const parentRect = parent.getBoundingClientRect()
                  const elementRect = element.getBoundingClientRect()
                  
                  // Vérifier si l'élément est visible horizontalement
                  if (elementRect.left < parentRect.left) {
                    parent.scrollTo({
                      left: parent.scrollLeft + (elementRect.left - parentRect.left) - 20,
                      behavior: 'smooth'
                    })
                  } else if (elementRect.right > parentRect.right) {
                    parent.scrollTo({
                      left: parent.scrollLeft + (elementRect.right - parentRect.right) + 20,
                      behavior: 'smooth'
                    })
                  }
                  break
                }
                parent = parent.parentElement
              }
              
              // Mettre à jour la position après le scroll
              setTimeout(() => {
                const updatedRect = element.getBoundingClientRect()
                if (updatedRect.width > 0 && updatedRect.height > 0) {
                  setHighlightedElement(element)
                }
              }, 600)
            })
          })
        } else {
          // Retry si l'élément n'est pas trouvé (peut être pas encore rendu)
          if (attempts < 10) {
            setTimeout(() => findAndPositionElement(attempts + 1), 200)
          } else {
            setHighlightedElement(null)
          }
        }
      } else {
        setHighlightedElement(null)
      }
    }
    
    // Démarrer la recherche avec un petit délai pour laisser le DOM se stabiliser
    const timeoutId = setTimeout(() => {
      findAndPositionElement(0)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [showOnboarding, currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    // Sauvegarder que cet utilisateur spécifique a vu l'onboarding
    if (userId) {
      localStorage.setItem(`dashboard_onboarding_seen_${userId}`, 'true')
    }
    setShowOnboarding(false)
    setHighlightedElement(null)
  }

  // Utiliser un state pour stocker la position mise à jour
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null)
  
  // Mettre à jour la position de l'élément quand il change ou après scroll
  useEffect(() => {
    if (!showOnboarding) return
    if (!highlightedElement) {
      setElementPosition(null)
      return
    }
    
    const updatePosition = () => {
      const rect = highlightedElement.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setElementPosition(rect)
      }
    }
    
    updatePosition()
    
    // Mettre à jour après les animations de scroll
    const timeoutId = setTimeout(updatePosition, 600)
    
    // Écouter les événements de scroll pour mettre à jour la position
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [highlightedElement])

  // Calculer la position du tooltip en tenant compte des limites de l'écran
  const getTooltipStyle = (stepPosition: DOMRect | undefined): React.CSSProperties => {
    if (!highlightedElement || !stepPosition || viewportSize.width === 0) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 'calc(100vw - 2rem)'
      }
    }

    const viewportWidth = viewportSize.width
    const viewportHeight = viewportSize.height
    const tooltipMaxWidth = Math.min(384, viewportWidth - 32) // max-w-sm = 384px, avec marge de 16px de chaque côté
    const margin = 20
    const safeMargin = 16 // Marge de sécurité pour éviter les bords

    // Sur mobile, toujours centrer horizontalement et placer intelligemment verticalement
    const isMobile = viewportWidth < 640
    // Hauteur estimée : header (~60px) + description (~80px) + navigation (~70px) + padding (~40px)
    const tooltipEstimatedHeight = isMobile ? 250 : 280
    
    // Calculer la position préférée selon la configuration
    let preferredLeft = stepPosition.left + stepPosition.width / 2
    let preferredTop = stepPosition.bottom + margin
    let preferredTransform = 'translateX(-50%)'

    if (step.position === 'top') {
      const topSpace = stepPosition.top
      if (topSpace >= tooltipEstimatedHeight + margin) {
        preferredTop = stepPosition.top - margin
        preferredTransform = 'translate(-50%, -100%)'
      } else {
        // Pas assez d'espace en haut, placer en bas
        preferredTop = stepPosition.bottom + margin
        preferredTransform = 'translateX(-50%)'
      }
    } else if (step.position === 'bottom') {
      const bottomSpace = viewportHeight - stepPosition.bottom
      if (bottomSpace >= tooltipEstimatedHeight + margin) {
        preferredTop = stepPosition.bottom + margin
        preferredTransform = 'translateX(-50%)'
      } else {
        // Pas assez d'espace en bas, placer en haut
        preferredTop = stepPosition.top - margin
        preferredTransform = 'translate(-50%, -100%)'
      }
    } else if (step.position === 'left' && !isMobile) {
      const leftSpace = stepPosition.left
      if (leftSpace >= tooltipMaxWidth + margin) {
        preferredLeft = stepPosition.left - margin
        preferredTop = stepPosition.top + stepPosition.height / 2
        preferredTransform = 'translate(-100%, -50%)'
      } else {
        // Pas assez d'espace à gauche, utiliser position par défaut (en bas)
        preferredLeft = stepPosition.left + stepPosition.width / 2
        preferredTop = stepPosition.bottom + margin
        preferredTransform = 'translateX(-50%)'
      }
    } else if (step.position === 'right' && !isMobile) {
      const rightSpace = viewportWidth - stepPosition.right
      if (rightSpace >= tooltipMaxWidth + margin) {
        preferredLeft = stepPosition.right + margin
        preferredTop = stepPosition.top + stepPosition.height / 2
        preferredTransform = 'translateY(-50%)'
      } else {
        // Pas assez d'espace à droite, utiliser position par défaut (en bas)
        preferredLeft = stepPosition.left + stepPosition.width / 2
        preferredTop = stepPosition.bottom + margin
        preferredTransform = 'translateX(-50%)'
      }
    } else {
      // Sur mobile ou position par défaut : centrer horizontalement, placer en bas
      preferredLeft = stepPosition.left + stepPosition.width / 2
      preferredTop = stepPosition.bottom + margin
      preferredTransform = 'translateX(-50%)'
    }

    // Sur mobile, toujours centrer horizontalement
    if (isMobile) {
      preferredLeft = viewportWidth / 2
    }

    // S'assurer que le tooltip ne dépasse pas horizontalement
    const tooltipActualWidth = isMobile ? viewportWidth - 32 : tooltipMaxWidth
    if (preferredLeft - tooltipActualWidth / 2 < safeMargin) {
      preferredLeft = tooltipActualWidth / 2 + safeMargin
    } else if (preferredLeft + tooltipActualWidth / 2 > viewportWidth - safeMargin) {
      preferredLeft = viewportWidth - tooltipActualWidth / 2 - safeMargin
    }

    // S'assurer que le tooltip ne dépasse pas verticalement
    if (preferredTop - tooltipEstimatedHeight < safeMargin) {
      preferredTop = safeMargin
      preferredTransform = preferredTransform.replace(/translate\([^)]*\)/, '').replace(/translateX\([^)]*\)/, '').replace(/translateY\([^)]*\)/, '') || ''
      if (!preferredTransform) preferredTransform = 'translateX(-50%)'
    } else if (preferredTop + tooltipEstimatedHeight > viewportHeight - safeMargin) {
      preferredTop = viewportHeight - tooltipEstimatedHeight - safeMargin
      preferredTransform = preferredTransform.replace(/translate\([^)]*\)/, '').replace(/translateX\([^)]*\)/, '').replace(/translateY\([^)]*\)/, '') || ''
      if (!preferredTransform) preferredTransform = 'translateX(-50%)'
    }

    // Créer le style complet
    const style: React.CSSProperties = {
      maxWidth: `${tooltipMaxWidth}px`,
      width: isMobile ? 'calc(100vw - 2rem)' : `${tooltipMaxWidth}px`,
      maxHeight: 'calc(100vh - 2rem)',
      left: `${preferredLeft}px`,
      top: `${preferredTop}px`,
      transform: preferredTransform
    }

    return style
  }

  if (!showOnboarding) return null

  const step = steps[currentStep]
  const stepPosition = elementPosition || highlightedElement?.getBoundingClientRect()

  return (
    <>
      {/* Overlay sombre avec trou pour l'élément mis en évidence */}
      <div className="fixed inset-0 z-[9998] bg-black/60 transition-opacity">
        {highlightedElement && stepPosition && (
          <div
            className="absolute border-4 border-blue-500 rounded-lg shadow-2xl shadow-blue-500/50 pointer-events-none transition-all"
            style={{
              left: stepPosition.left - 4,
              top: stepPosition.top - 4,
              width: stepPosition.width + 8,
              height: stepPosition.height + 8,
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </div>

      {/* Tooltip d'onboarding */}
      <div
        className="fixed z-[9999] bg-white rounded-lg shadow-2xl transition-all mx-4 sm:mx-0 flex flex-col max-h-[calc(100vh-2rem)]"
        style={getTooltipStyle(stepPosition)}
      >
        {/* Contenu scrollable */}
        <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {currentStep + 1} / {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-4 leading-relaxed text-sm sm:text-base">{step.description}</p>
        </div>

        {/* Navigation - toujours visible en bas */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200 bg-white px-4 sm:px-6 pb-4 sm:pb-6 flex-shrink-0">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base flex-shrink-0 ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed opacity-50'
                : 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.dashboard?.pagination?.previous || 'Précédent'}</span>
          </button>

          <div className="flex gap-1 items-center flex-1 justify-center min-w-0">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all flex-shrink-0 ${
                  index === currentStep ? 'bg-blue-600 w-6' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all text-sm sm:text-base flex-shrink-0 font-medium"
          >
            <span className="whitespace-nowrap text-white">
              {currentStep === steps.length - 1 
                ? (t.dashboard?.onboarding?.complete?.title || 'Terminer') 
                : (t.dashboard?.pagination?.next || 'Suivant')}
            </span>
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 flex-shrink-0 text-white" />}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  )
}

