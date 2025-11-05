'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClientBrowser } from '@/lib/supabase'
import { 
  convertPrice, 
  formatPrice, 
  getCurrencyFromCountry,
  DEFAULT_EXCHANGE_RATES,
  CURRENCY_SYMBOLS 
} from '@/lib/currency'
import { getExchangeRates, initializeExchangeRates } from '@/lib/exchangeRates'

const STORAGE_KEY = 'preferred_currency'
const DEFAULT_CURRENCY = 'EUR'

interface CurrencyContextType {
  currency: string
  setCurrency: (currency: string) => Promise<void>
  convert: (priceEUR: number) => number
  format: (priceEUR: number) => string
  symbol: string
  isLoading: boolean
  exchangeRates: Record<string, number>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY)
  const [isLoading, setIsLoading] = useState(true)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES)

  // Initialiser les taux de change au montage
  useEffect(() => {
    initializeExchangeRates()
    
    // Charger les taux de change
    getExchangeRates()
      .then(rates => {
        setExchangeRates(rates)
      })
      .catch(error => {
        console.error('Erreur chargement taux de change:', error)
        setExchangeRates(DEFAULT_EXCHANGE_RATES)
      })
  }, [])

  // Charger la devise au montage
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        // 1. Vérifier la préférence utilisateur (Supabase user_metadata)
        const supabase = createClientBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user?.user_metadata?.preferred_currency) {
          setCurrencyState(user.user_metadata.preferred_currency)
          setIsLoading(false)
          return
        }

        // 2. Vérifier localStorage (vérifier si on est côté client)
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored && exchangeRates[stored]) {
            setCurrencyState(stored)
            setIsLoading(false)
            return
          }
        }

        // 3. Détection IP (côté client uniquement)
        if (typeof window !== 'undefined') {
          try {
            const response = await fetch('https://ipapi.co/json/')
            const data = await response.json()
            
            if (data.country_code) {
              const detectedCurrency = getCurrencyFromCountry(data.country_code)
              if (detectedCurrency && exchangeRates[detectedCurrency]) {
                setCurrencyState(detectedCurrency)
                localStorage.setItem(STORAGE_KEY, detectedCurrency)
                setIsLoading(false)
                return
              }
            }
          } catch (ipError) {
            console.warn('Erreur détection IP:', ipError)
          }
        }

        // 4. Fallback EUR
        setCurrencyState(DEFAULT_CURRENCY)
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur chargement devise:', error)
        setCurrencyState(DEFAULT_CURRENCY)
        setIsLoading(false)
      }
    }

    // Attendre que les taux de change soient chargés avant de charger la devise
    if (Object.keys(exchangeRates).length > 0) {
      loadCurrency()
    }
  }, [exchangeRates])

  // Fonction pour changer la devise
  const setCurrency = useCallback(async (newCurrency: string) => {
    if (!exchangeRates[newCurrency] && !DEFAULT_EXCHANGE_RATES[newCurrency]) {
      console.error('Devise invalide:', newCurrency)
      return
    }

    // Mettre à jour immédiatement pour déclencher le re-render
    setCurrencyState(newCurrency)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newCurrency)
    }

    // Sauvegarder dans user_metadata si connecté (en arrière-plan)
    try {
      const supabase = createClientBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Ne pas attendre, sauvegarder en arrière-plan
        supabase.auth.updateUser({
          data: {
            preferred_currency: newCurrency
          }
        }).catch(error => {
          console.error('Erreur sauvegarde préférence devise:', error)
        })
      }
    } catch (error) {
      console.error('Erreur sauvegarde préférence devise:', error)
    }
  }, [exchangeRates])

  // Convertir un prix EUR vers la devise actuelle
  const convert = useCallback((priceEUR: number) => {
    return convertPrice(priceEUR, currency, exchangeRates)
  }, [currency, exchangeRates])

  // Formater un prix EUR selon la devise actuelle
  const format = useCallback((priceEUR: number) => {
    const converted = convert(priceEUR)
    return formatPrice(converted, currency)
  }, [currency, convert])

  const symbol = CURRENCY_SYMBOLS[currency] || currency

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      convert,
      format,
      symbol,
      isLoading,
      exchangeRates
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}

