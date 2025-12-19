export const OM_WAVE_CONFIG = {
  orange_money: {
    phone: "+225 07 88 39 95 30",
    qr: "/images/orangemoney.jpeg",
    name: "Ouattara Noura Marie"
  },
  wave: {
    phone: "+225 07 88 39 95 30",
    qr: "/images/wavemoney.jpeg",
    name: "Ouattara Noura Marie Meliane"
  },
  congo_mobile_money: {
    phone: "+243 899 101 087",
    qr: null, // Pas de QR code pour le Congo
    name: "Benedicte Mbuyi"
  }
} as const;

// Taux de change EUR vers FCFA (à ajuster selon le taux actuel)
export const EUR_TO_FCFA_RATE = 655.96; // 1 EUR = ~656 FCFA

