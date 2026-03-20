---
name: jellyfin-codebase-layout
description: Where key UI and app structure live in the Jellyfin web client (jellyfin-web). Use when locating or changing navbar/AppBar, home hero, home quick tiles under the hero, routing (experimental vs stable), layout mode, themes, or top-level app structure.
---

# Jellyfin Web Codebase Layout

## Overview

This skill points to where important UI and structure are implemented so you can find or change them without hunting. All paths are relative to the repo root (`src/` for source).

## Quick lookup

| What you need | Where it lives |
|---------------|----------------|
| **Navbar (bar + text) color** | Default: `apps/experimental/AppLayout.tsx` (AppBar `sx`). When home hero is active: `components/homeHero/homeHero.scss` (`body.homeHeroActive .MuiAppBar-root`). Sandbox transparent nav: same file, `body.sandboxPage.homeHeroActive .MuiAppBar-root`. |
| **Home hero (carousel, backdrop)** | `components/homeHero/homeHero.js`, `components/homeHero/homeHero.scss`. |
| **Home quick tiles (5 under hero)** | `components/homeQuickCollections/homeQuickCollections.js`, `homeQuickCollections.scss`. Loaded from `controllers/hometab.js` (`loadQuickCollections`, `destroyQuickCollections`). DOM: `.homeQuickCollections` between `.homeHero` and `.sections` in `controllers/home.html` and `apps/experimental/routes/home.tsx`. |
| **Experimental vs stable app** | `RootAppRouter.tsx` chooses `EXPERIMENTAL_APP_ROUTES` vs `STABLE_APP_ROUTES` via layout mode. Experimental layout: `apps/experimental/AppLayout.tsx` + `apps/experimental/routes/`. Stable: `apps/stable/`. |
| **Layout mode** | `constants/layoutMode`, `components/layoutManager.js`; persisted via `LAYOUT_SETTING_KEY`. Default is experimental. |
| **Toolbar contents** | Shared: `components/toolbar/AppToolbar.tsx`. Experimental wrapper: `apps/experimental/components/AppToolbar/index.tsx`. |
| **Sandbox test page** | `apps/experimental/routes/sandbox.tsx`, route in `apps/experimental/routes/asyncRoutes/user.ts`; URL `#/sandbox`. |

## When to read more

- **Navbar/hero overrides, legacy skinHeader:** See [references/layout.md](references/layout.md) for SCSS selectors and body classes.
- **Routes, async routes, dashboard vs wizard:** See [references/layout.md](references/layout.md) for route tables and entry points.
- **Hero carousel reference (BINGE-style):** See [references/hero-reference-binge.md](references/hero-reference-binge.md) for Swiper-style structure, multi-line titles, editorial label, tags, and actions to align the home hero with.
- **Do's and don'ts:** See [references/dos-and-donts.md](references/dos-and-donts.md) for patterns to follow and pitfalls to avoid (hero, navbar, skills). **Update this file as you work** when you learn something new.
