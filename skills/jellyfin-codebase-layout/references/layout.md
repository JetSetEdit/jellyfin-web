# Jellyfin Web — Where Things Live (reference)

Paths are relative to repo root. Source lives under `src/`.

## Navbar / App bar

- **Experimental app (MUI):**
  - **Default bar and text color:** `src/apps/experimental/AppLayout.tsx` — AppBar `sx` (`backgroundColor`, `color`).
  - **When home hero is active:** `src/components/homeHero/homeHero.scss`:
    - `body.homeHeroActive .MuiAppBar-root` — background and backdrop-filter for the bar (overrides AppLayout when hero is shown, e.g. on `#/home`).
    - `body.homeHeroActive .skinHeader.skinHeader-withBackground` and `.skinHeader.semiTransparent` — same for legacy header.
  - **Sandbox only (transparent bar over hero):** `body.sandboxPage.homeHeroActive .MuiAppBar-root` in the same file.
- **Legacy app:** Header is `.skinHeader`; theme and overrides in `src/themes/` (e.g. `_base/theme.scss`, theme-specific `theme.scss`).

**Body classes that affect nav:** `homeHeroActive` (set when hero fixed backdrop exists), `mainScrolled`, `sandboxPage` (sandbox route).

## Home hero

- **Component:** `src/components/homeHero/homeHero.js` (carousel, dots, backdrop, content).
- **Styles:** `src/components/homeHero/homeHero.scss` (sizing, transitions, fixed backdrop, navbar overrides).
- **Fixed backdrop:** Created in JS and prepended to the page so the hero image stays fixed on scroll.

## Routing and layout mode

- **Router entry:** `src/RootAppRouter.tsx`. Uses `createHashRouter`; layout mode decides which app routes are used.
- **Layout mode:** From `localStorage` key in `src/components/layoutManager.js` (`LAYOUT_SETTING_KEY`). Values in `src/constants/layoutMode.js` (e.g. Experimental, Tv). Default/no setting → experimental.
- **Experimental routes:** `src/apps/experimental/routes/routes.tsx` (`EXPERIMENTAL_APP_ROUTES`). User routes: `apps/experimental/routes/asyncRoutes/`, legacy routes: `apps/experimental/routes/legacyRoutes/`.
- **Stable routes:** `src/apps/stable/routes/` (used when layout mode is not experimental).
- **Dashboard / wizard:** `DASHBOARD_APP_ROUTES`, `WIZARD_APP_ROUTES` in `RootAppRouter.tsx`; paths from `apps/dashboard/`, `apps/wizard/`.

## Toolbar

- **Shared toolbar (MUI Toolbar):** `src/components/toolbar/AppToolbar.tsx` (back, menu, children, buttons, user menu).
- **Experimental wrapper:** `src/apps/experimental/components/AppToolbar/index.tsx` (wraps shared AppToolbar; adds SyncPlay, RemotePlay, Search, UserViewNav, ServerButton).

## Sandbox

- **Page:** `src/apps/experimental/routes/sandbox.tsx`.
- **Route:** Registered in `src/apps/experimental/routes/asyncRoutes/user.ts`; URL `#/sandbox`.
- **Purpose:** Test hero + navbar (mock hero, toggles for `homeHeroActive` / `mainScrolled`, placeholder sections to scroll).

## Themes

- **MUI theme:** `src/themes/index.ts` (default theme), theme variants under `src/themes/` (e.g. `dark/`, `light/`, `appletv/`).
- **Theme provider:** `src/RootAppRouter.tsx` (wraps app with `ThemeProvider`).
- **Legacy skin header variables:** `src/themes/_base/theme.scss`, `_palette.scss`; `--jf-palette-AppBar-*`, `$appBar-*`.
