# Hero carousel reference (BINGE-style)

Reference HTML structure for a streaming-style hero carousel. Use when aligning the Jellyfin home hero (e.g. multi-line titles, editorial label, tags, actions).

## Structure overview

- **Container:** `swiper swiper-fade swiper-initialized swiper-horizontal`
- **Track:** `swiper-wrapper` (no horizontal translate on wrapper for fade; slides stack and use opacity)
- **Slides:** `swiper-slide` — active has `opacity: 1`, others `opacity: 0`; `transform: translate3d(-Npx, 0, 0)` for layout
- **Effect:** Fade between slides (only one slide visible via opacity)

## Per-slide content (inside each `swiper-slide`)

1. **Content wrapper:** e.g. `hero-banners__category-banner-content`
2. **Info block:** `hero-banners__category-banner-info`
   - **Title block:** `hero-banners__title-wrapper`
     - **Title lines:** `hero-banners__title-lines` → multiple `h2.hero-banners__title-line` with size modifiers:
       - `hero-banners__large` — single big word (e.g. "TED")
       - `hero-banners__medium` — 2–3 words
       - `hero-banners__small` — longer line
     - **Editorial label:** `h2.hero-banners__editorial-label` — one line, accent color (e.g. "NEW EPISODE WED 8.30PM AEDT", "Go back to the beginning...")
   - **Tags:** `hero-banners__tags` — first row: rating + year (e.g. PG, 2026); second row: genres (e.g. Lifestyle, Property) as `hero-banners__tag` spans
   - **Description:** expandable content area (short blurb)
   - **Actions:** `hero-banners__actions`
     - Primary: "Watch S1 EP1" with play SVG icon (`tp-button tp-button-primary`)
     - Secondary: "More Info" (`tp-button tp-button-secondary`)

## Patterns to mirror in Jellyfin hero

| Reference | Jellyfin equivalent |
|-----------|----------------------|
| Multiple `h2` title lines (large/medium/small) | Split `homeHeroTitle` into lines; add size classes by line length or word count |
| Editorial label (accent color) | Use tagline as `homeHeroTagline` / editorial label; keep accent colors |
| Tags row (rating • year • genres) | Already have `homeHeroMeta`; can restyle as chips (spans) |
| Primary + secondary buttons | Already have Play + Info; ensure primary has icon, secondary text-only |
| Fade between slides | Already using opacity transition in `.homeHero.is-transitioning` |

## Slide state (reference)

- Inactive: `opacity: 0`, `aria-hidden="true"`, `tabindex="-1"` on buttons
- Active: `opacity: 1`, `aria-hidden="false"`, `tabindex="0"` on buttons, classes `swiper-slide-active swiper-slide-visible swiper-slide-fully-visible`

## Data attributes (reference)

- `data-title`, `data-description`, `data-cta-details` on slide for a11y/SEO
- `data-swiper-slide-index` for index
