'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface CarouselItem {
  id: string
  image_url: string
  redirect_url: string
  title?: string
  display_order: number
}

interface CarouselPopupProps {
  items: CarouselItem[]
  onClose: () => void
  title?: string
}

export default function CarouselPopup({ items, onClose, title = 'Nouveautés dans votre boutique' }: CarouselPopupProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isClosing, setIsClosing] = useState(false)

  // Défilement automatique toutes les 5 secondes (pause si onglet caché)
  useEffect(() => {
    if (items.length <= 1) return

    let interval: NodeJS.Timeout | null = null
    let isVisible = true

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (!isVisible && interval) {
        clearInterval(interval)
        interval = null
      } else if (isVisible && !interval) {
        startInterval()
      }
    }

    const startInterval = () => {
      interval = setInterval(() => {
        if (!isVisible) return
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
      }, 5000)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    startInterval()

    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [items.length])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Délai pour l'animation de fermeture
  }

  const handleImageClick = (redirectUrl: string) => {
    router.push(redirectUrl)
    handleClose()
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
  }

  if (items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#012F4E] to-[#00A1C6] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Carousel Content */}
        <div className="relative">
          {/* Image principale */}
          <div className="relative w-full h-[500px] bg-gray-100">
            <Image
              src={currentItem.image_url}
              alt={currentItem.title || 'Nouveauté'}
              fill
              className="object-contain cursor-pointer"
              onClick={() => handleImageClick(currentItem.redirect_url)}
              priority
            />
          </div>

          {/* Navigation arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
                aria-label="Image précédente"
              >
                <svg className="w-6 h-6 text-[#012F4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
                aria-label="Image suivante"
              >
                <svg className="w-6 h-6 text-[#012F4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Dots indicator */}
          {items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-[#00A1C6] w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Aller à l'image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer avec titre si disponible */}
        {currentItem.title && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-center text-gray-700 font-medium">{currentItem.title}</p>
          </div>
        )}
      </div>
    </div>
  )
}
