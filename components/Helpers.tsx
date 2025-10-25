'use client'

import { useState } from 'react'

// Formatage monétaire
export function fmtEUR(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Composant Tooltip simple et accessible
interface TooltipProps {
  children: React.ReactNode
  content: string
}

export function Tooltip({ children, content }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="cursor-help"
        aria-describedby="tooltip"
      >
        {children}
      </div>
      {isOpen && (
        <div
          id="tooltip"
          role="tooltip"
          className="absolute z-10 w-64 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  )
}
