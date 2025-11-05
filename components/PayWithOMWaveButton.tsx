'use client'

import React, { useState } from 'react'
import ModalOMWave from './ModalOMWave'
import { EUR_TO_FCFA_RATE } from '@/config/omWave'
import type { CartItem } from '@/lib/CartContext'

interface PayWithOMWaveButtonProps {
  orderId: string
  cartItems: CartItem[]
  amountEUR: number
}

export default function PayWithOMWaveButton({ orderId, cartItems, amountEUR }: PayWithOMWaveButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Calculer le montant en FCFA
  const amountFCFA = Math.round(amountEUR * EUR_TO_FCFA_RATE)
  
  // Générer le nom des produits (pour affichage)
  const productName = cartItems.map(item => item.title).join(', ')

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Mobile Money
      </button>

      <ModalOMWave
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={orderId}
        cartItems={cartItems}
        productName={productName}
        amountEUR={amountEUR}
        amountFCFA={amountFCFA}
      />
    </>
  )
}

