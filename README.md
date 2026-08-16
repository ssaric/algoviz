[![Publish Docker](https://github.com/ssaric/algoviz/actions/workflows/publish.yml/badge.svg)](https://github.com/ssaric/algoviz/actions/workflows/publish.yml)

# Algoviz

A project focusing on visualzing A* pathfinding algorithm. Available at https://algoviz.njanjo.com.

Draw walls, drag the start and end markers, then watch a search run. Every move
is recorded as a described step, so the timeline scrubs in both directions and
hovering any cell shows what the algorithm was thinking when it got there.

Four searches are included. They share one best-first loop and differ only in
what they are drawn to:

| Algorithm         | Picks the cell with the lowest       | Shortest path?          |
| ----------------- | ------------------------------------ | ----------------------- |
| A*                | `g + h`                              | yes                     |
| Dijkstra          | `g` — cost so far, goal ignored      | yes                     |
| Greedy best-first | `h` — estimate to goal, cost ignored | no                      |
| Breadth-first     | discovery order                      | yes, with uniform costs |

Movement is four-way, so the true remaining distance is always the Manhattan
one. Euclidean underestimates it and makes A* fan out; Euclidean squared
overestimates and makes A* charge at the goal while giving up the shortest-path
guarantee. Both are selectable, alongside a custom mathjs formula.

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

- [x] Algorithm "thoughts" (hover any cell to see what the algorithm did there and why)

- [x] Multiple algorithms with different affinities

- [ ] Side-by-side maps to compare different heuristics
