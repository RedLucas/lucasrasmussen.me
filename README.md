# lucasrasmussen.me

[![CI](https://github.com/RedLucas/lucasrasmussen.me/actions/workflows/ci.yml/badge.svg)](https://github.com/RedLucas/lucasrasmussen.me/actions/workflows/ci.yml)

> A React + Vite project

## Build Setup

```bash
# install dependencies
npm install

# serve with hot reload at localhost:5173
npm run dev

# build for production
npm run build

# preview the production build locally
npm run preview

# lint
npm run lint
```

## Deploy

The site deploys to Cloudflare Workers as static assets — there is no
server-side Worker code, `wrangler.jsonc` just points at the Vite build
output:

```bash
npm run deploy
```

which builds and then runs `wrangler deploy`. That requires being logged in
locally (`npx wrangler login`); in CI, Cloudflare Workers Builds runs the same
build/deploy commands with the account context already in place — see the
project setup notes for the one-time dashboard configuration.

## Background

The background is a WebGL fragment shader that draws a procedural sunset
landscape — layered ridge silhouettes under a graded sky. It's generated from a
random seed on each load, so every visit gets a different scene, and it needs no
API key, network request, or image asset. See `src/shaders/landscape.frag`.

It respects `prefers-reduced-motion` (the scene renders but holds still), pauses
while the tab is hidden, and falls back to the plain gradient if WebGL is
unavailable.
