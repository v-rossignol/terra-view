# AGENTS.md

> Guide pour les agents IA travaillant sur Terra View

## Description du projet

Terra View est un client de visualisation 2D de surfaces planetaires pour le projet Infinity. Il permet d afficher et d interagir avec des cartes planetaires en 2D.

## Stack technique

| Technologie | Version | Role |
|-------------|---------|------|
| React | 18.2.0 | Framework frontend |
| PixiJS | 7.3.2 | Rendering 2D pour les cartes planetaires |
| TypeScript | 5.3.3 | Typage statique |
| Vite | 5.0.8 | Bundler et serveur de developpement |
| Zustand | 4.4.7 | Gestion d etat |
| Axios | 1.6.2 | Client HTTP pour les requetes API |

## Structure du projet

```
terra-view/
├── src/
│   ├── assets/           # Ressources statiques
│   ├── components/      # Composants React
│   ├── hooks/           # Hooks personnalises
│   ├── stores/          # Stores Zustand
│   ├── types/           # Definitions de types TypeScript
│   ├── utils/           # Fonctions utilitaires
│   ├── App.tsx          # Composant principal
│   └── main.tsx         # Point d entree
├── index.html           # Template HTML
├── package.json         # Dependances et scripts
├── tsconfig.json        # Configuration TypeScript
├── tsconfig.node.json   # Configuration TypeScript pour Node
└── vite.config.ts       # Configuration Vite
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| npm run dev | Lance le serveur de developpement (Vite) |
| npm run build | Construit le projet pour la production |
| npm run lint | Execute ESLint sur le code |
| npm run preview | Previsualise le build de production |

## Conventions de code

### TypeScript
- Utiliser des interfaces pour les types d objets
- Privilégier les types explicites pour les props de composants
- Utiliser unknown plutôt que any lorsque le type est incertain
- Marquer les fonctions async avec Promise<T> pour le retour

### React
- Composants en PascalCase
- Props en camelCase
- Utiliser des hooks personnalisés dans src/hooks/
- Gestion d état via Zustand (stores dans src/stores/)

### PixiJS
- Les sprites et conteneurs doivent être nettoyés dans useEffect cleanup
- Utiliser PIXI.Assets.load() pour le chargement des assets
- Les textures doivent être gérées via le cache de PixiJS

### Organisation des fichiers
- Un fichier = un composant/hook/store/type
- Les tests unitaires dans __tests__/ à côté du fichier testé
- Les styles CSS-in-JS ou modules CSS selon besoin

## Points d attention

1. Performance: Les rendus PixiJS peuvent être coûteux. Toujours:
   - Limiter le nombre de sprites actifs
   - Utiliser PIXI.BatchRenderer pour les éléments statiques
   - Nettoyer les ressources non utilisées

2. Gestion mémoire:
   - Désabonner les event listeners
   - Nettoyer les textures PixiJS dans useEffect cleanup
   - Éviter les fuites mémoire avec les observables

3. API Infinity:
   - Base URL: À définir (variable d environnement VITE_INFINITY_API_URL)
   - Authentification: Bearer token via VITE_INFINITY_API_TOKEN
   - Les endpoints sont documentés dans le backend Infinity

4. Coordinate System:
   - Le système utilise des coordonnées planétaires (latitude/longitude)
   - Conversion nécessaire entre coordonnées géographiques et pixels
   - Projection: Mercator ou équivalente pour les planètes

## Variables d environnement

```env
VITE_INFINITY_API_URL=https://api.infinity.example.com
VITE_INFINITY_API_TOKEN=your_token_here
VITE_DEBUG_MODE=true
```

## Bonnes pratiques pour les agents IA

### Quand travailler sur ce projet:
1. Lire d abord: Consulter le README.md et ce fichier AGENTS.md
2. Analyser le code existant: Comprendre la structure avant de modifier
3. Respecter les conventions: Suivre les patterns etablis
4. Documenter: Ajouter des commentaires pour le code complexe
5. Tester: Verifier que les modifications ne cassent pas le build

### Taches courantes:
- Ajouter un composant: Creer dans src/components/ avec Storybook si applicable
- Ajouter un store: Creer dans src/stores/ et l importer dans le composant
- Ajouter un type: Definir dans src/types/ et l exporter
- Modifier la config: Mettre à jour vite.config.ts ou tsconfig.json

### A eviter:
- Modifier directement node_modules/
- Commiter des fichiers generes (build/, dist/)
- Utiliser any dans les types
- Laisser du code commente inutilise

## Ressources utiles

- Documentation PixiJS: https://pixijs.com/docs/
- Documentation React: https://react.dev/reference
- Documentation Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction
- Documentation Vite: https://vitejs.dev/guide/

## Contact

Pour les questions spécifiques au projet Infinity, contacter l équipe backend ou consulter la documentation interne.