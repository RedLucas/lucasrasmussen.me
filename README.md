# lucasrasmussen.me

[![CircleCI](https://circleci.com/gh/RedLucas/lucasrasmussen.me/tree/master.svg?style=svg)](https://circleci.com/gh/RedLucas/lucasrasmussen.me/tree/master)

> A React + Vite project

## Build Setup

``` bash
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

## Background

The background is a WebGL fragment shader that draws a procedural sunset
landscape — layered ridge silhouettes under a graded sky. It's generated from a
random seed on each load, so every visit gets a different scene, and it needs no
API key, network request, or image asset. See `src/shaders/landscape.frag`.

It respects `prefers-reduced-motion` (the scene renders but holds still), pauses
while the tab is hidden, and falls back to the plain gradient if WebGL is
unavailable.
