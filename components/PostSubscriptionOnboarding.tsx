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
      title: t.dashboard?.postSubscriptionOnboarding?.welcome?.title || 'Félicitations ! Votre abonnement est actif',
      description: t.dashboard?.postSubscriptionOnboarding?.welcome?.description || 'Découvrez maintenant toutes les fonctionnalités premium de Cash360. Nous allons vous guider à travers les différents onglets disponibles.',
      position: 'bottom'
    },
    {
      id: 'overview',
      title: t.dashboard?.postSubscriptionOnboarding?.overview?.title || 'Tableau de bord',
      description: t.dashboard?.postSubscriptionOnboarding?.overview?.description || 'Votre vue d\'ensemble : revenus, dépenses, épargne du mois, et suivi personnalisé. C\'est ici que vous commencez chaque session.',
      targetSelector: '[data-onboarding="overview-tab"]',
      position: 'bottom'
    },
    {
      id: 'budget',
      title: t.dashboard?.postSubscriptionOnboarding?.budget?.title || 'Budget & suivi',
      description: t.dashboard?.postSubscriptionOnboarding?.budget?.description || 'Gérez vos revenus et dépenses mensuels. Ajoutez vos catégories de dépenses, suivez votre taux d\'utilisation et visualisez vos principales catégories.',
      targetSelector: '[data-onboarding="budget-tab"]',
      position: 'bottom'
    },
    {
      id: 'fast',
      title: t.dashboard?.postSubscriptionOnboarding?.fast?.title || 'Jeûne financier',
      description: t.dashboard?.postSubscriptionOnboarding?.fast?.description || 'Reprenez le contrôle de vos habitudes de dépenses avec un jeûne financier de 30 jours. Choisissez les catégories à mettre en pause et suivez votre progression quotidienne.',
      targetSelector: '[data-onboarding="fast-tab"]',
      position: 'bottom'
    },
    {
      id: 'complete',
      title: t.dashboard?.postSubscriptionOnboarding?.complete?.title || 'Vous êtes prêt !',
      description: t.dashboard?.postSubscriptionOnboarding?.complete?.description || 'Explorez maintenant toutes les fonctionnalités premium. N\'hésitez pas à revenir sur cette page pour consulter votre tableau de bord.',
      position: 'bottom'
    }
  ], [t])

  useEffect(() => {
    if (!showOnboarding || currentStep >= steps.length) return

    const step = steps[currentStep]
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement
      if (element) {
        setHighlightedElement(element)
        setTimeout(() => {
          const rect = element.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const viewportWidth = window.innerWidth
          
          const scrollX = window.scrollX || window.pageXOffset
          const scrollY = window.scrollY || window.pageYOffset
          
          const elementTop = rect.top + scrollY
          const elementHeight = rect.height
          const targetScrollY = elementTop + elementHeight / 2 - viewportHeight / 2
          
          const elementLeft = rect.left + scrollX
          const elementWidth = rect.width
          const targetScrollX = elementLeft + elementWidth / 2 - viewportWidth / 2
          
          window.scrollTo({
            top: Math.max(0, targetScrollY),
            left: Math.max(0, targetScrollX),
            behavior: 'smooth'
          })
          
          setTimeout(() => {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            })
          }, 50)
        }, 150)
      } else {
        setHighlightedElement(null)
      }
    } else {
      setHighlightedElement(null)
    }
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
  const stepPosition = highlightedElement?.getBoundingClientRect()

  const getTooltipStyle = (): React.CSSProperties => {
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
    const tooltipEstimatedHeight = isMobile ? 250 : 280
    
    let preferredLeft = stepPosition.left + stepPosition.width / 2
    let preferredTop = stepPosition.bottom + margin
    let preferredTransform = 'translateX(-50%)'

    if (step.position === 'top') {
      const topSpace = stepPosition.top
      if (topSpace >= tooltipEstimatedHeight + margin) {
        preferredTop = stepPosition.top - margin
        preferredTransform = 'translate(-50%, -100%)'
      } else {
        preferredTop = stepPosition.bottom + margin
        preferredTransform = 'translateX(-50%)'
      }
    } else if (step.position === 'bottom') {
      const bottomSpace = viewportHeight - stepPosition.bottom
      if (bottomSpace >= tooltipEstimatedHeight + margin) {
        preferredTop = stepPosition.bottom + margin
        preferredTransform = 'translateX(-50%)'
      } else {
        preferredTop = stepPosition.top - margin
        preferredTransform = 'translate(-50%, -100%)'
      }
    }

    if (isMobile) {
      preferredLeft = viewportWidth / 2
    }

    const tooltipActualWidth = isMobile ? viewportWidth - 32 : tooltipMaxWidth
    if (preferredLeft - tooltipActualWidth / 2 < safeMargin) {
      preferredLeft = tooltipActualWidth / 2 + safeMargin
    } else if (preferredLeft + tooltipActualWidth / 2 > viewportWidth - safeMargin) {
      preferredLeft = viewportWidth - tooltipActualWidth / 2 - safeMargin
    }

    if (preferredTop - tooltipEstimatedHeight < safeMargin) {
      preferredTop = safeMargin
      preferredTransform = 'translateX(-50%)'
    } else if (preferredTop + tooltipEstimatedHeight > viewportHeight - safeMargin) {
      preferredTop = viewportHeight - tooltipEstimatedHeight - safeMargin
      preferredTransform = 'translateX(-50%)'
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
        style={getTooltipStyle()}
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

