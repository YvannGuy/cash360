'use client'

import { useLanguage } from '@/lib/LanguageContext'

interface CTABoxProps {
  title?: string
  subtitle?: string
}

export default function CTABox({ title, subtitle }: CTABoxProps) {
  const { t } = useLanguage()
  const defaultTitle = title || t.ctaBox.defaultTitle
  const defaultSubtitle = subtitle || t.ctaBox.defaultSubtitle

  const handleOpenModal = () => {
    const modal = document.getElementById('calendly-modal');
    if (modal) modal.style.display = 'block';
  }

  return (
    <div className="bg-[#0B1B2B] rounded-xl p-8 text-white">
      <h3 className="text-xl font-semibold mb-2">{defaultTitle}</h3>
      <p className="text-gray-300 mb-6">{defaultSubtitle}</p>
      <button
        onClick={handleOpenModal}
        className="inline-flex items-center px-6 py-3 bg-[#D4AF37] text-[#0B1B2B] font-medium rounded-lg hover:brightness-95 transition-all duration-200"
      >
        {t.ctaBox.button}
      </button>
    </div>
  )
}
