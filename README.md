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

## Configuration

Copy `.env.example` to `.env` and fill in an Unsplash access key to enable the
random background image:

``` bash
cp .env.example .env
```

Without a key the site still works — it just falls back to the plain gradient
background. The same variable needs to be set in the deploy environment for the
background to appear on the built site.
