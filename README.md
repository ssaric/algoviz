[![Publish Docker](https://github.com/ssaric/algoviz/actions/workflows/publish.yml/badge.svg)](https://github.com/ssaric/algoviz/actions/workflows/publish.yml)

# Algoviz

A project focusing on visualzing A* pathfinding algorithm. Available at https://algoviz.njanjo.com.

## Development

Requires Node 24. The project uses npm; there is no yarn lockfile any more.

```sh
npm install
npm run dev         # dev server
npm run build       # static build into build/
npm run preview     # serve the production build on :4173
```

Checks, all of which must pass:

```sh
npm run lint        # prettier --check + eslint
npm run check       # svelte-check / typescript
npm test            # vitest unit tests
npm run test:e2e    # playwright (needs: npx playwright install chromium)
```

## Roadmap

- [x] Multiple heuristics

- [x] Seekable timeline

- [x] Typescript ready

- [ ] Algorithm "thoughts" (algorithm should display in each field what was it trying to do)

- [ ] Side-by-side maps to compare different heuristics
