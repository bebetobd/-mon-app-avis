# 💎 Application d'Avis Clients

Application de collecte d'avis clients pour **boutiques** et **centres hospitaliers**.

## 🚀 Lancer en local

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000

## 📦 Déployer sur Vercel

### Méthode 1 : Via GitHub (recommandé)

1. Poussez ce projet sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Premier commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-NOM/mon-app-avis.git
   git push -u origin main
   ```

2. Allez sur [vercel.com](https://vercel.com) → "Add New Project"
3. Importez votre dépôt GitHub
4. Cliquez **Deploy**
5. ✅ Votre app est en ligne !

### Méthode 2 : Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Suivez les instructions. C'est tout !

## 🔧 Personnalisation

- **Catégories** : Modifiez l'objet `CATEGORIES` dans `src/App.jsx`
- **Couleurs** : Modifiez les variables `gold`, `bgGradient`, etc.
- **Base de données** : Connectez Firebase ou Supabase pour persister les avis

## 📱 Mode Tablette / Kiosque

Idéal pour un usage sur tablette à l'accueil :
1. Déployez l'app sur Vercel
2. Ouvrez l'URL sur la tablette
3. Ajoutez à l'écran d'accueil (Safari : Partager → Sur l'écran d'accueil)
4. Activez le mode guidé/kiosque dans les paramètres de la tablette
