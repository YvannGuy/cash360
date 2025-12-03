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

interface PostSubscriptionOnboardingProps {
  userId?: string | null
}

export default function PostSubscriptionOnboarding({ userId }: PostSubscriptionOnboardingProps) {
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
    
    // Vérifier si l'onboarding post-abonnement a déjà été vu par CET utilisateur spécifique
    const onboardingSeen = localStorage.getItem(`post_subscription_onboarding_seen_${userId}`)
    const subscriptionSuccess = new URLSearchParams(window.location.search).get('subscription') === 'success'
    
    // Afficher l'onboarding seulement si :
    // 1. L'utilisateur vient de payer un abonnement (subscription=success dans l'URL)
    // 2. Et qu'il ne l'a pas encore vu
    if (subscriptionSuccess && !onboardingSeen) {
      // Attendre que le DOM soit prêt et que les onglets soient chargés
      setTimeout(() => {
        setShowOnboarding(true)
      }, 1500)
    }
  }, [userId])

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: t.dashboard?.postSubscriptionOnboarding?.welcome?.title || '🎉 Bienvenue dans votre espace premium !',
      description: t.dashboard?.postSubscriptionOnboarding?.welcome?.description || 'Félicitations pour votre abonnement Sagesse de Salomon ! Vous avez maintenant accès à tous les outils pour transformer votre vie financière. Laissez-nous vous guider à travers vos nouveaux onglets.',
      position: 'bottom'
    },
    {
      id: 'overview',
      title: t.dashboard?.postSubscriptionOnboarding?.overview?.title || '📊 Tableau de bord',
      description: t.dashboard?.postSubscriptionOnboarding?.overview?.description || 'Votre centre de contrôle financier. Visualisez en un coup d\'œil votre résumé du mois (revenus, dépenses, épargne), votre suivi personnalisé avec votre jeûne financier actif, et recevez votre inspiration biblique quotidienne. Commencez toujours ici !',
      targetSelector: '[data-onboarding="overview-tab"]',
      position: 'bottom'
    },
    {
      id: 'budget',
      title: t.dashboard?.postSubscriptionOnboarding?.budget?.title || '💰 Budget & suivi',
      description: t.dashboard?.postSubscriptionOnboarding?.budget?.description || 'Gérez vos finances mois par mois. Enregistrez vos revenus du mois, ajoutez vos dépenses par catégorie (alimentation, transport, loisirs...), et suivez votre budget en temps réel. Visualisez vos principales catégories de dépenses et votre taux d\'utilisation.',
      targetSelector: '[data-onboarding="budget-tab"]',
      position: 'bottom'
    },
    {
      id: 'fast',
      title: t.dashboard?.postSubscriptionOnboarding?.fast?.title || '⛔ Jeûne financier – 30 jours',
      description: t.dashboard?.postSubscriptionOnboarding?.fast?.description || 'Reprenez le contrôle de vos dépenses impulsives. Lancez un jeûne de 30 jours en choisissant les catégories à éviter (restaurants, vêtements, abonnements...). Suivez votre progrès jour après jour, calculez vos économies potentielles et renforcez votre discipline financière.',
      targetSelector: '[data-onboarding="fast-tab"]',
      position: 'bottom'
    },
    {
      id: 'profile',
      title: t.dashboard?.postSubscriptionOnboarding?.profile?.title || '👤 Profil',
      description: t.dashboard?.postSubscriptionOnboarding?.profile?.description || 'Gérez vos informations personnelles, votre devise préférée, votre langue et votre abonnement. Vous pouvez suspendre ou relancer votre abonnement à tout moment depuis cet onglet.',
      targetSelector: '[data-onboarding="profile-tab"]',
      position: 'bottom'
    },
    {
      id: 'complete',
      title: t.dashboard?.postSubscriptionOnboarding?.complete?.title || '✅ Vous êtes prêt à transformer vos finances !',
      description: t.dashboard?.postSubscriptionOnboarding?.complete?.description || 'Vous connaissez maintenant tous vos outils premium. Commencez par votre Tableau de bord pour voir votre situation, puis configurez votre Budget & suivi pour suivre vos finances. Prêt pour le changement ? Lancez votre premier Jeûne financier !',
      position: 'bottom'
    }
  ], [t])

  // Utiliser un state pour stocker la position mise à jour
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null)

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
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
              
              // Pour les éléments dans un conteneur scrollable horizontal (comme les onglets)
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
  }, [highlightedElement, showOnboarding])

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
      localStorage.setItem(`post_subscription_onboarding_seen_${userId}`, 'true')
    }
    // Nettoyer l'URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('subscription')
      window.history.replaceState({}, '', url.toString())
    }
    setShowOnboarding(false)
    setHighlightedElement(null)
  }

  if (!showOnboarding) return null

  const step = steps[currentStep]
  const stepPosition = elementPosition || highlightedElement?.getBoundingClientRect()

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
    const tooltipMaxWidth = Math.min(384, viewportWidth - 32)
    const margin = 20
    const safeMargin = 16

    const isMobile = viewportWidth < 640
    // Hauteur estimée ajustée pour mobile (header + description + navigation + padding)
    const tooltipEstimatedHeight = isMobile ? 280 : 300
    
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

  return (
    <>
      {/* Overlay sombre avec trou pour l'élément mis en évidence */}
      <div className="fixed inset-0 z-[9998] bg-black/60 transition-opacity">
        {highlightedElement && stepPosition && (
          <div
            className="absolute border-4 border-[#FEBE02] rounded-lg shadow-2xl shadow-[#FEBE02]/50 pointer-events-none transition-all"
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
                <h3 className="text-base sm:text-lg font-bold text-[#012F4E]">{step.title}</h3>
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
                : 'text-[#00A1C6] hover:bg-[#00A1C6]/10 active:bg-[#00A1C6]/20'
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
                  index === currentStep ? 'bg-[#FEBE02] w-6' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-[#FEBE02] to-[#F99500] text-[#012F4E] rounded-lg hover:from-[#FFD700] hover:to-[#FFA500] active:from-[#FFC700] active:to-[#FF9500] transition-all text-sm sm:text-base flex-shrink-0 font-semibold"
          >
            <span className="whitespace-nowrap">
              {currentStep === steps.length - 1 
                ? (t.dashboard?.postSubscriptionOnboarding?.complete?.button || 'Commencer') 
                : (t.dashboard?.pagination?.next || 'Suivant')}
            </span>
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
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

