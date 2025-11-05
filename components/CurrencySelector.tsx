'use client'

import React from 'react'
import { useCurrency } from '@/lib/CurrencyContext'
import { CURRENCY_SYMBOLS } from '@/lib/currency'

export default function CurrencySelector() {
  const { currency, setCurrency, isLoading } = useCurrency()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
        <span className="animate-pulse">...</span>
      </div>
    )
  }

  const popularCurrencies = ['EUR', 'XOF', 'USD', 'CNY', 'MXN', 'GBP']

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        title="Changer de devise"
      >
        <span className="font-semibold">{CURRENCY_SYMBOLS[currency] || currency}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="py-2">
          {popularCurrencies.map((curr) => {
            const isActive = curr === currency
            return (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{CURRENCY_SYMBOLS[curr] || curr}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

