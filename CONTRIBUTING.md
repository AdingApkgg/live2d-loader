# Contributing to live2d-loader

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/AdingApkgg/live2d-loader.git
cd live2d-loader

# Install dependencies (requires pnpm >= 9, Node.js >= 18)
pnpm install

# Start the dev playground
pnpm run dev

# Build all packages
pnpm run build

# Run type checks
pnpm run typecheck

# Lint
pnpm run lint

# Format
pnpm run format
```

## Project Structure

```
packages/
  core/             # @live2d-loader/core — engine, pipeline, events
  element/          # @live2d-loader/element — Lit Web Components
  adapter-cubism2/  # Cubism 2.x adapter (.moc)
  adapter-cubism5/  # Cubism 4/5 adapter (.moc3)
  renderer-webgl/   # WebGL2 renderer
  renderer-pixi/    # PixiJS 8 renderer
  playground/       # Dev demo (not published)
```

## Pull Request Process

1. Fork the repo and create a feature branch from `main`.
2. Make your changes. Follow the existing code style.
3. Run `pnpm run build && pnpm run typecheck && pnpm run lint` to verify.
4. Add a changeset if your change affects published packages:
   ```bash
   pnpm changeset
   ```
5. Open a pull request with a clear description of the change.

## Commit Messages

Use concise, descriptive commit messages. No strict convention enforced, but prefer:

- `feat: add model caching support`
- `fix: correct texture Y-flip for Cubism 2`
- `docs: update CDN usage guide`
- `chore: bump dependencies`

## Code Style

- TypeScript strict mode
- Named exports only (no default exports)
- `I` prefix for interfaces (`ICubismAdapter`, `IRenderer`)
- Prettier for formatting (run `pnpm run format`)
- ESLint for linting (run `pnpm run lint`)

## Reporting Issues

Use [GitHub Issues](https://github.com/AdingApkgg/live2d-loader/issues). Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/Node.js version
- Model format (Cubism 2 or 4/5)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
