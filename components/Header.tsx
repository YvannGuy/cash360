
'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSwitch from './LanguageSwitch';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="w-full bg-transparent">
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/278ed0c1279a8f73de226a782353c037.png"
              alt="Cash360"
              width={80}
              height={80}
              className="h-20 w-auto"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-white">{t.header.title}</h1>
              <p className="text-white/80 text-sm">{t.header.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </header>
  );
}
