'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { tracking } from './tracking'

export interface CartItem {
  id: string
  title: string
  img: string
  price: number
  quantity: number
  category?: string // Catégorie du produit pour limiter les quantités
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Tracker l'ouverture du panier (une fois par session)
  useEffect(() => {
    const hasTrackedCartOpen = sessionStorage.getItem('cart_opened_tracked')
    if (!hasTrackedCartOpen && cartItems.length > 0) {
      // Utiliser cartOpened au lieu de toolUsed pour le panier
      tracking.cartOpened(cartItems.length)
      sessionStorage.setItem('cart_opened_tracked', 'true')
    }
  }, [cartItems.length])

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id)
      const itemCategory = (item as any).category || 'capsules'
      
      // Pour capsules, pack, ebook, abonnement : maximum 1 quantité
      // Pour analyse-financiere : quantités illimitées
      if (existingItem) {
        if (itemCategory === 'analyse-financiere') {
          // Analyse financière : quantités illimitées, on peut toujours augmenter
          const updated = prev.map(cartItem =>
            cartItem.id === item.id 
              ? { ...cartItem, quantity: cartItem.quantity + 1 } 
              : cartItem
          )
          // Tracker l'ajout au panier
          tracking.addToCart(item.id, existingItem.quantity + 1, item.price)
          return updated
        } else {
          // Autres produits : maximum 1 quantité
          if (existingItem.quantity >= 1) {
            return prev // Déjà à 1, ne rien faire
          }
        }
      }
      // Tracker l'ajout au panier
      tracking.addToCart(item.id, 1, item.price)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const itemCategory = item.category || 'capsules'
        // Pour capsules, pack, ebook, abonnement : maximum 1 quantité
        // Pour analyse-financiere : quantités illimitées
        const maxQuantity = itemCategory === 'analyse-financiere' ? Infinity : 1
        return { ...item, quantity: Math.min(quantity, maxQuantity) }
      }
      return item
    }))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getSubtotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

