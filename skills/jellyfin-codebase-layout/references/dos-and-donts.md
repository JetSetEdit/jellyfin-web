# Jellyfin Web — Do's and Don'ts

Guidance learned from working on the codebase. Update this file as you discover new patterns.

## Home hero

### Do

- **Fixed backdrop:** Start the hero image layer below the navbar (`top: 48px`, `height: calc(100vh - 48px)`) on the main app so the image doesn’t sit under the banner and cause a jump on first scroll. Use `body.homeHeroActive:not(.sandboxPage)` so the sandbox can keep full-viewport for “image under nav” tests.
- **Full-viewport gradient:** Use a fixed gradient layer (e.g. `.homeHeroFixedGradient`) with `inset: 0` so the gradient starts at the top of the viewport (under the navbar) and there’s no visible “start” line below the nav.
- **Z-index stacking:** Keep fixed hero layers behind hero content: backdrop and gradient at `z-index: 0`, `.homeHero` at `z-index: 1` so title, buttons, arrows, and dots sit in front.
- **Scroll fade:** Fade both the fixed backdrop and the fixed gradient together (same opacity) when using scroll-based fade to “Recently Added”; clean up both in scroll cleanup.
- **Pill/dot progress animation:** When switching the active carousel dot, restart the progress animation so it runs 0→100% again: set `animation = 'none'`, force reflow (e.g. `progressEl.offsetHeight`), then set the full animation string with duration (e.g. `homeHeroDotProgress ${AUTO_ADVANCE_MS}ms linear forwards`). Otherwise `forwards` keeps the bar at 100% and it won’t re-run.
- **Hero cleanup:** When removing the fixed backdrop, also remove the fixed gradient (sibling), clear `_heroFixedGradient`, and run scroll-fade cleanup (`_heroBackdropScrollCleanup`) before removing the backdrop node.
- **Scroll fade vs first paint:** Run `renderCarousel` (first slide content) **before** `setupBackdropScrollFade` in `loadHero`. If scroll fade runs first, it sets inline `opacity: 1` on an empty fixed backdrop and the main image won’t visibly fade in; use `removeProperty('opacity')` when scroll math says fully visible so `.homeHeroFixedBackdrop-visible` can transition. Use `opacity: 0 !important` on `.homeHeroFixedBackdrop-transitioning` / gradient counterpart so slide crossfade still wins over scroll inline opacity.

### Don't

- **Don’t** use a single full-viewport fixed backdrop (`inset: 0`) for the hero image on the main home without starting it below the navbar—it causes a visible jump on first scroll when the in-flow hero block moves.
- **Don’t** put the gradient only inside the in-flow `.homeHero` block—then it starts below the navbar and creates a visible edge. Use a fixed full-viewport gradient layer instead.
- **Don’t** give the fixed gradient a higher z-index than the hero content (e.g. avoid gradient at `z-index: 1` if `.homeHero` has no z-index)—the gradient will sit on top of the title and buttons.
- **Don’t** assume the dot progress animation will restart when toggling `.homeHeroDot-active`; the animation stays at its end state. Explicitly restart it when the active dot changes.
- **Don’t** forget to apply scroll-driven opacity to both the backdrop and the gradient element if both exist, so they fade in sync.

## Home quick collections row (under hero)

Five tiles directly under the hero: **BoxSets** (up to 5 from `getItems`), remainder **placeholder** tiles (`.homeQuickTile--placeholder`) so the row is always full. Strings: `HomeQuickCollectionPlaceholder`, `HomeQuickCollectionPlaceholderHint` in locale JSON.

### Do

- **Wire through HomeTab:** Call `loadQuickCollections` in parallel with `loadHero` on first load; call it again when `sectionsRendered` is true and `onResume` runs (otherwise the row never refreshes after leaving Home and coming back).
- **Destroy with hero:** In `destroyHomeSections`, call `destroyQuickCollections` whenever you call `destroyHero`.
- **Placeholders:** Use non-interactive `div`s (not `itemAction`) so `itemShortcuts` only bind to real collection links. Keep placeholder copy short; hint uses `line-clamp` on small tiles.
- **Tiles use `itemShortcuts`:** Real tiles: `itemAction` + `data-action="link"` and `data-id` / `data-serverid` / `data-type` for `BoxSet`.

### Don't

- **Don’t** add a restrictive `Fields` filter on the BoxSet `getItems` query unless you’ve verified the server still returns `Id`, `Name`, and image tags as needed.
- **Don’t** forget the container in **both** `controllers/home.html` (stable/legacy) and `apps/experimental/routes/home.tsx` (experimental), or inject it in `hometab.js` when missing.

## Navbar

### Do

- **Two places for bar color:** Set default bar (and text) color in `apps/experimental/AppLayout.tsx` (AppBar `sx`). Override when hero is active in `components/homeHero/homeHero.scss` with `body.homeHeroActive .MuiAppBar-root` (and legacy `.skinHeader` selectors as needed).
- **Sandbox exception:** Use `body.sandboxPage.homeHeroActive .MuiAppBar-root` for the sandbox-only transparent/blur nav so the hero image can show under the nav there.

### Don't

- **Don’t** rely only on AppLayout for the bar color when the hero is active—homeHero.scss overrides with `!important` when `body.homeHeroActive` is set.

## Skills and references

### Do

- **Add to this file:** When you fix a bug or learn a “do this / avoid that” pattern, add a short Do/Don’t under the right section (or a new section) so the next session can follow it.
- **Keep paths and selectors accurate:** When editing layout.md or this file, use real file paths and class names from the repo.

### Don't

- **Don’t** duplicate long how-to content in both SKILL.md and references—keep SKILL.md to quick lookup and “when to read more”; put procedure and do/don’t detail in references.
