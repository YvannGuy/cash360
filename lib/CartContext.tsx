'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

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

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id)
      const itemCategory = (item as any).category || 'capsules'
      
      // Pour capsules, pack, ebook, abonnement : maximum 1 quantité
      // Pour analyse-financiere : quantités illimitées
      if (existingItem) {
        if (itemCategory === 'analyse-financiere') {
          // Analyse financière : quantités illimitées, on peut toujours augmenter
          return prev.map(cartItem =>
            cartItem.id === item.id 
              ? { ...cartItem, quantity: cartItem.quantity + 1 } 
              : cartItem
          )
        } else {
          // Autres produits : maximum 1 quantité
          if (existingItem.quantity >= 1) {
            return prev // Déjà à 1, ne rien faire
          }
        }
      }
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

