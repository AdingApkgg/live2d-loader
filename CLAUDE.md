# CLAUDE.md

Context for AI assistants working on this codebase.

## What is this?

`live2d-loader` is a modular, pluggable Live2D model loader for the web. It supports both Cubism 2 (legacy `.moc`) and Cubism 4/5 (modern `.moc3`) models through a unified TypeScript API, with optional Web Component UI via Lit.

## Monorepo Structure

```
packages/
  core/             # @live2d-loader/core — engine, pipeline, events, types
  element/          # @live2d-loader/element — Lit web components
  adapter-cubism2/  # @live2d-loader/adapter-cubism2 — Cubism 2.x (.moc)
  adapter-cubism5/  # @live2d-loader/adapter-cubism5 — Cubism 4/5 (.moc3)
  renderer-webgl/   # @live2d-loader/renderer-webgl — WebGL2 renderer
  renderer-pixi/    # @live2d-loader/renderer-pixi — PixiJS 8 renderer (alternative)
  playground/       # Dev demo app (private, not published)
```

## Common Commands

```bash
pnpm install          # Install deps
pnpm run dev          # Start playground (Vite dev server)
pnpm run build        # Build all packages
pnpm run test         # Run tests (vitest)
pnpm run lint         # Lint with ESLint
pnpm run format       # Format with Prettier
pnpm run format:check # Check formatting (CI)
pnpm run typecheck    # Type-check all packages
pnpm run clean        # Remove dist/ from all packages
pnpm changeset        # Create a changeset for versioning
pnpm run release      # Build + publish via changesets
```

## Key Technical Details

### Cubism SDK Loading

Cubism cores are **proprietary** and loaded dynamically at runtime from CDN — never bundled. The `load-cubism-core` middleware handles this.

### Adapter Pattern

Each Cubism version has its own adapter implementing `ICubismAdapter`:

- `createModel()` — Parse .moc/.moc3, compute transform matrix
- `setupTextures()` — Upload textures to GPU
- `updateModel()` — Apply animations (breathing, blink, sway)
- `drawModel()` — Execute draw (Cubism 2 self-renders; Cubism 5 uses our renderer)

### Cubism 2 Gotchas (adapter-cubism2)

- Must set `UNPACK_FLIP_Y_WEBGL = 1` for textures (OpenGL UV convention)
- Must call `setMatrix()` before `draw()` (pixel-to-clip-space transform)
- Must clean WebGL state before `draw()` (SDK manages its own GL programs)
- Uses `loadParam()`/`saveParam()` cycle for animation parameter management
- `Live2D.setGL(gl)` is a **global** call — only one context active at a time

### Pipeline Middleware Order

1. `resolveUrl` — Normalize model source to full URL
2. `fetchModelJson` — Fetch and parse model.json / model3.json
3. `detectVersion` — Determine Cubism version, normalize settings
4. `loadCubismCore` — Dynamically load appropriate SDK from CDN
5. `loadTextures` — Fetch and decode texture images
6. `createModel` — Adapter creates the internal model

### Web Components (element package)

- `<live2d-model>` — Single model display, configure via `src` attribute + `configure()` method
- `<live2d-widget>` — Full widget with toolbar, speech bubbles, model switching
- `autoload.ts` — Zero-config entry point for CDN `<script>` embedding

## Framework Integration

The `<live2d-model>` Web Component works in all frameworks. Framework-specific guides live in `docs/frameworks/`:

- **React**: Use `ref` + `configure()`, add JSX type declaration
- **Vue / Nuxt**: Add `isCustomElement` config; Nuxt needs `<ClientOnly>`
- **Next.js**: `'use client'` + `dynamic(import, { ssr: false })`
- **SolidJS**: Native support, use `attr:` / `on:` prefixes
- **Svelte / SvelteKit**: Native support; SvelteKit needs `browser` guard
- **Angular**: Add `CUSTOM_ELEMENTS_SCHEMA`

Core API (`createLive2DLoader` with `<canvas>`) works in any framework with no special setup beyond SSR guards.

## Style Conventions

- TypeScript strict mode, ES2022 target
- Named exports only (no default exports)
- `I` prefix for adapter/renderer interfaces (`ICubismAdapter`, `IRenderer`)
- Lit decorators for web components
- tsup for library builds (ESM + CJS + DTS)
- Changesets for version management
