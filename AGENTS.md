# AGENTS.md

> Guide for AI agents working on Terra View

## Project Description

Terra View is a 2D planetary surface visualization client for the Infinity project. It allows displaying and interacting with 2D planetary maps.

## Technical Stack

| Technology | Version | Role |
|-------------|---------|------|
| React | 18.2.0 | Frontend framework |
| PixiJS | 7.3.2 | 2D rendering for planetary maps |
| TypeScript | 5.3.3 | Static typing |
| Vite | 5.0.8 | Bundler and development server |
| Zustand | 4.4.7 | State management |
| Axios | 1.6.2 | HTTP client for API requests |

## Project Structure

```
terra-view/
├── src/
│   ├── assets/           # Static resources
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks
│   ├── stores/          # Zustand stores
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main component
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tsconfig.node.json   # TypeScript configuration for Node
└── vite.config.ts       # Vite configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server (Vite) |
| npm run build | Build project for production |
| npm run lint | Run ESLint on the code |
| npm run preview | Preview production build |

## Coding Conventions

### TypeScript
- Use interfaces for object types
- Prefer explicit types for component props
- Use unknown instead of any when type is uncertain
- Mark async functions with Promise<T> for return type

### React
- Components in PascalCase
- Props in camelCase
- Use custom hooks in src/hooks/
- State management via Zustand (stores in src/stores/)

### PixiJS
- Sprites and containers must be cleaned up in useEffect cleanup
- Use PIXI.Assets.load() for asset loading
- Textures should be managed via PixiJS cache

### File Organization
- One file = one component/hook/store/type
- Unit tests in __tests__/ next to the tested file
- Styles: CSS-in-JS or CSS modules as needed

## Important Considerations

1. Performance: PixiJS rendering can be expensive. Always:
   - Limit the number of active sprites
   - Use PIXI.BatchRenderer for static elements
   - Clean up unused resources

2. Memory Management:
   - Unsubscribe event listeners
   - Clean up PixiJS textures in useEffect cleanup
   - Avoid memory leaks with observables

3. Infinity API:
   - Base URL: To be defined (environment variable VITE_INFINITY_API_URL)
   - Authentication: Bearer token via VITE_INFINITY_API_TOKEN
   - Endpoints are documented in the Infinity backend

4. Coordinate System:
   - The system uses planetary coordinates (latitude/longitude)
   - Conversion needed between geographic coordinates and pixels
   - Projection: Mercator or equivalent for planets

## Environment Variables

```env
VITE_INFINITY_API_URL=https://api.infinity.example.com
VITE_INFINITY_API_TOKEN=your_token_here
VITE_DEBUG_MODE=true
```

## Best Practices for AI Agents

### When working on this project:
1. Read first: Consult README.md and this AGENTS.md file
2. Analyze existing code: Understand the structure before modifying
3. Follow conventions: Adhere to established patterns
4. Document: Add comments for complex code
5. Test: Ensure modifications do not break the build

### Common Tasks:
- Add a component: Create in src/components/ with Storybook if applicable
- Add a store: Create in src/stores/ and import in the component
- Add a type: Define in src/types/ and export it
- Modify config: Update vite.config.ts or tsconfig.json

### Avoid:
- Directly modifying node_modules/
- Committing generated files (build/, dist/)
- Using any in types
- Leaving unused commented code

## Useful Resources

- PixiJS Documentation: https://pixijs.com/docs/
- React Documentation: https://react.dev/reference
- Zustand Documentation: https://docs.pmnd.rs/zustand/getting-started/introduction
- Vite Documentation: https://vitejs.dev/guide/

## Contact

For Infinity project specific questions, contact the backend team or consult internal documentation.