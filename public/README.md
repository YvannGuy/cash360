# 📁 Dossier Public - Fichiers Statiques

Ce dossier contient tous les fichiers statiques accessibles publiquement.

## 📂 Structure

```
public/
├── images/              # Images du site
│   ├── logo/           # Logos Cash360
│   ├── icons/          # Icônes et petites images
│   └── screenshots/    # Captures d'écran et illustrations
└── README.md
```

## 🖼️ Comment utiliser les images

### 1. Ajouter une image

Placez vos images dans le dossier approprié :
- **Logos** → `public/images/logo/`
- **Icônes** → `public/images/icons/`
- **Screenshots** → `public/images/screenshots/`

### 2. Utiliser dans votre code

#### En HTML/JSX simple :
```jsx
<img src="/images/logo/cash360.png" alt="Cash360 Logo" />
```

#### Avec Next.js Image (recommandé) :
```jsx
import Image from 'next/image'

<Image 
  src="/images/logo/cash360.png" 
  alt="Cash360 Logo"
  width={200}
  height={100}
/>
```

## ⚡ Avantages du composant Next.js Image

- ✅ Optimisation automatique des images
- ✅ Lazy loading
- ✅ Formats modernes (WebP, AVIF)
- ✅ Responsive automatique
- ✅ Meilleure performance

## 📝 Bonnes pratiques

1. **Nommage** : Utilisez des noms descriptifs en kebab-case
   - ✅ `cash360-logo-dark.png`
   - ❌ `IMG_1234.png`

2. **Format** : Privilégiez les formats optimisés
   - PNG pour les logos et images avec transparence
   - JPG pour les photos
   - SVG pour les icônes vectorielles
   - WebP pour les images modernes

3. **Taille** : Optimisez vos images avant de les ajouter
   - Utilisez [TinyPNG](https://tinypng.com/) ou [Squoosh](https://squoosh.app/)
   - Évitez les images trop lourdes (> 500KB)

4. **Alt text** : Toujours fournir un texte alternatif descriptif

## 🎯 Exemples d'images à ajouter

- `logo/cash360-main.png` - Logo principal
- `logo/cash360-white.png` - Logo version blanche
- `icons/favicon.ico` - Favicon du site
- `screenshots/dashboard.png` - Capture du tableau de bord
- `screenshots/formation.jpg` - Image de la formation

