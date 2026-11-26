---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/styles/main.css","src/components/DraftBoardView.ts","src/components/Navbar.ts","src/components/LobbyView.ts","src/components/RosterHubView.ts","src/components/MatchesView.ts","src/components/LeaderboardView.ts","src/components/AuthModal.ts"]
---

# Surface Brief: PokeDraft Manager

- **Scope:** `index.html`, `src/styles/main.css`, `src/main.ts`, `src/components/Navbar.ts`, `src/components/LobbyView.ts`, `src/components/DraftBoardView.ts`, `src/components/RosterHubView.ts`, `src/components/MatchesView.ts`, `src/components/LeaderboardView.ts`, `src/components/AuthModal.ts`
- **Visitor Mode:** `Operate` (code-led)
- **Audience & Job:** Competitive Pokémon Draft League coaches and league admins drafting live on desktop (Discord voice calls) and reviewing rosters, 18-type defensive coverage, matches, and MVP rankings on mobile during the week.
- **Constraints:** Preserve 100% of existing REST API contracts (`/api/*`), TypeScript types, and Spanish copy. Zero emojis in UI chrome.

## Direction contract

THESIS: Rebuild PokeDraft Manager as a matte-obsidian competitive Pokédex tactile console (**Pro-Controller Tactile Deck**), refusing the incumbent dark-blue translucent glassmorphism SaaS template and flat esports spreadsheets.

OWN-WORLD: Deep matte carbon-obsidian chassis (`#0B0C10`) with sculpted convex dark neomorphic plates (`#12151C`, dual top-left specular + bottom-right contact shadow + 1px micro-bevel) and recessed concave Poké-Slot wells (`#08090D`); Pokédex Crimson (`#E62938`) strictly for primary actions, active turn rail, and active view LED; Optic Cyan (`#22D3EE`) strictly for the Pokédex lens and scanner/immunity telemetry; Competitive Gold (`#F5B82E`) for point budgets, costs, and rank #1; `Chakra Petch` display + `Barlow` UI + `JetBrains Mono` (`tabular-nums`) data; zero emojis in UI chrome (custom crisp SVGs only).

STORY: A coach enters a live draft night, instantly reads the Pokédex hardware shell, active Snake turn, remaining budget, legal affordable picks, and coach slot wells without ambiguity, then switches seamlessly to rosters, 18-type defensive coverage, matches, and MVP rankings.

FIRST VIEWPORT: Sticky Pokédex obsidian header (`#main-header`) with circular cyan optic lens + 3 micro-LEDs, recessed concave 5-view nav dock, concave league selector, and LED account trigger; immediately below, full-width primary view workspace (`#main-container`) led on the flagship Draft Room by the crimson-railed Active Turn Command Deck + upcoming Snake pick strip, concave search/type/sort filter bar, fixed-scale 4-column Poké-Slot Pokémon catalog grid, and 360px right tactical sidebar (coaches with segmented slot wells + pick history).

FORM: Pro-Controller Tactile Deck, candidate 3 of 7, `seed:09a68cfdf9268f97` — raised by *Botanical Folio* (fixed-scale spatial card registration), *Orienteering Map* (strict separation between resting catalog and active turn/legality layer), and *Emigre Bitmap Specimen* (pixel-honest animated sprite rendering & crisp Dex `#` numeric contrast).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
