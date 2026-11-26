---
name: PokeDraft Manager
description: Pro-Controller Tactile Deck — Pokédex Obsidian visual design system for competitive Pokémon Draft League operations.
colors:
  pokedex-crimson: "#e62938"
  pokedex-crimson-hover: "#ff3b4a"
  pokedex-crimson-deep: "#9e1420"
  optic-cyan: "#22d3ee"
  competitive-gold: "#f5b82e"
  emerald-active: "#10b981"
  amber-mid: "#f59e0b"
  danger-red: "#ef4444"
  obsidian-chassis: "#0b0c10"
  obsidian-surface: "#12151c"
  obsidian-surface-elevated: "#171b24"
  obsidian-surface-high: "#1e2431"
  obsidian-well: "#08090d"
  obsidian-well-deep: "#050609"
  ink-primary: "#f3f5f9"
  ink-secondary: "#a4aebf"
  ink-muted: "#768196"
typography:
  display:
    fontFamily: "Chakra Petch, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Chakra Petch, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Chakra Petch, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
  2xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.pokedex-crimson}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.62rem 1.2rem"
  button-primary-hover:
    backgroundColor: "{colors.pokedex-crimson-hover}"
    textColor: "{colors.ink-primary}"
  button-secondary:
    backgroundColor: "{colors.obsidian-surface-elevated}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.62rem 1.2rem"
  button-secondary-hover:
    backgroundColor: "{colors.obsidian-surface-high}"
    textColor: "{colors.ink-primary}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.62rem 1.2rem"
  button-ghost-hover:
    backgroundColor: "{colors.obsidian-surface-elevated}"
    textColor: "{colors.ink-primary}"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.62rem 1.2rem"
  input-well:
    backgroundColor: "{colors.obsidian-well}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.62rem 0.9rem"
  card-surface:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "1.35rem"
  nav-dock:
    backgroundColor: "{colors.obsidian-well}"
    rounded: "{rounded.pill}"
    padding: "0.3rem"
  nav-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.48rem 0.9rem"
  nav-pill-active:
    backgroundColor: "{colors.obsidian-surface-high}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.pill}"
    padding: "0.48rem 0.9rem"
  type-badge:
    backgroundColor: "{colors.obsidian-well}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0.2rem 0.55rem"
  status-pill:
    backgroundColor: "{colors.obsidian-well}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.65rem"
  poke-slot-well:
    backgroundColor: "{colors.obsidian-well}"
    rounded: "{rounded.pill}"
    width: "92px"
    height: "92px"
---

# Design System: PokeDraft Manager

## Overview

**Creative North Star: "Pro-Controller Tactile Deck"**

PokeDraft Manager is built as a matte-obsidian competitive Pokédex hardware console engineered for live Snake Draft sessions and weekly league telemetry. Rather than mimicking flat spreadsheets or translucent SaaS dashboards, every panel behaves like machined polymer and anodized metal: convex control plates rise softly out of a deep carbon chassis (`#0b0c10`) while interactive inputs, navigation docks, score wells, and circular Poké-Slots recess cleanly below the deck plane.

The interface balances high-density competitive data—national Pokédex numbers, 18 elemental type badges, 6-stat bars, Snake turn queues, and K/D differentials—with disciplined chromatic restraint. Matte obsidian surfaces stay quiet so that Pokédex Crimson (`#e62938`), Optic Cyan (`#22d3ee`), and Competitive Gold (`#f5b82e`) carry unmistakable operational meaning without visual noise.

**Key Characteristics:**
- Matte carbon-obsidian chassis (`#0b0c10`) paired with sculpted dark neomorphic convex plates and recessed concave wells.
- Strict hardware signal separation: crimson for primary actions and active turn control, cyan for optic lens and scanner/focus telemetry, gold for budgets and top rank.
- Geometric display headings (`Chakra Petch`), crisp humanist UI copy (`Barlow`), and tabular monospace telemetry (`JetBrains Mono`).
- Custom 24px stroke-based SVG iconography throughout all navigation, status, and action chrome with zero UI emojis.
- Pixel-honest sprite presentation inside circular recessed wells, supporting animated pixel sprites alongside static fallback artwork.

## Colors

The palette pairs an ultra-low-luminance carbon-obsidian neutral architecture with high-contrast Pokédex hardware accents tuned for WCAG AA+ readability on dark surfaces.

### Primary
- **Pokédex Crimson** (`#e62938`): Reserved for primary actions (drafting a Pokémon, creating a league, starting the Snake Draft, submitting results), the active turn command deck border, the active view pill accent, and the header hairline trace.
- **Pokédex Crimson Hover** (`#ff3b4a`): Top-edge highlight for primary button hover states (`linear-gradient` paired with `#b31927`).
- **Pokédex Crimson Deep** (`#9e1420`): Lower gradient anchor on primary buttons and active week tabs, creating a beveled physical keycap feel.

### Secondary
- **Optic Cyan** (`#22d3ee`): The signature Pokédex lens hue. Used for the circular header optic dome, keyboard `:focus-visible` outlines, input focus rings, panel heading icons, Tera Captain pills, card hover highlights, immunity counts, and playoff cutline borders.

### Tertiary
- **Competitive Gold** (`#f5b82e`): Dedicated exclusively to economic and championship telemetry—remaining point budgets, Pokémon cost badges, setup phase banners, and `#1` leaderboard rank pills.
- **Emerald Active** (`#10b981`): Indicates live or completed states—online authentication LED, active league status pills, completed match borders, win differentials, and elite base stats (`>= 120`).
- **Amber Mid** (`#f59e0b`): Mid-tier base stat bar fill (`60–89`) and pending match status indicators.
- **Danger Red** (`#ef4444`): Low-tier base stat bar fill (`< 60`) and destructive confirmation actions (logout).

### Neutral
- **Obsidian Chassis** (`#0b0c10`): Root page canvas and browser theme color, accented with a subtle `2.5%` white top-center radial sheen.
- **Obsidian Surface** (`#12151c`): Resting card and panel body tone.
- **Obsidian Surface Elevated** (`#171b24`): Upper gradient stop on convex cards, filter docks, and secondary tactile buttons.
- **Obsidian Surface High** (`#1e2431`): Active navigation dock pill surface and hovered secondary button highlight.
- **Obsidian Well** (`#08090d`): Recessed concave floor for search fields, select inputs, the navigation dock track, coach rows, telemetry wells, coverage tiles, and Poké-Slot sockets.
- **Obsidian Well Deep** (`#050609`): Deepest shadow core inside sockets and modal backdrops.
- **Primary Ink** (`#f3f5f9`): Primary headings, Pokémon names, table values, and button copy.
- **Secondary Ink** (`#a4aebf`): Subtitles, navigation labels, field labels, and table column headers.
- **Muted Ink** (`#768196`): National Dex numbers (`#0000`), uppercase telemetry captions, and inactive indicators.

### Named Rules
**The Hardware Signal Rule.** Crimson (`#e62938`) owns turn authority and primary commitments; Cyan (`#22d3ee`) owns optical focus, inspection, and immunities; Gold (`#f5b82e`) owns points and rank #1. Never swap these roles or flood ambient backgrounds with saturated fills.

**The Tinted Ink Fallback Rule.** All 18 elemental type badges, status pills, and stat indicators use translucent `12%–16%` tinted wells with `42%–62%` border opacity and light foreground inks (`#f3f5f9` or high-luminance pastel tints) rather than saturated solid blocks, preserving contrast across dark obsidian surfaces.

## Typography

**Display Font:** `Chakra Petch` (with `system-ui, sans-serif` fallback; weights 500, 600, 700)
**Body Font:** `Barlow` (with `system-ui, sans-serif` fallback; weights 400, 500, 600, 700)
**Label/Mono Font:** `JetBrains Mono` (with `ui-monospace, monospace` fallback; weights 500, 600, 700)

**Character:** Angular, chamfer-inspired `Chakra Petch` headings evoke handheld Pokédex hardware, `Barlow` delivers compact Spanish UI copy without crowding, and `JetBrains Mono` locks every cost, Dex number, stat value, and K/D ratio onto rigid tabular columns.

### Hierarchy
- **Display** (`700`, `1.75rem` desktop / `1.35rem` mobile, `1.15` line-height, `-0.01em` tracking): View section titles (`Ligas de PokeDraft`, `Plantillas & Coberturas`) and active turn coach headlines (`1.45rem` desktop / `1.08rem` compact mobile).
- **Headline** (`700`, `1.25rem`–`1.3rem`, `1.25` line-height, `-0.01em` tracking): League card titles, modal headers, and round/week section headings (`1.15rem`).
- **Title** (`700`, `0.95rem`–`1.2rem`, `1.2` line-height, `0.01em`–`0.06em` tracking): Navbar wordmark (`1.2rem`), Pokémon card names (`1rem`), match coach names (`1.05rem`), and uppercase panel headings (`0.95rem`, `0.06em` tracking).
- **Body** (`400`–`600`, `15px` base / `0.86rem`–`0.94rem` UI controls, `1.5` line-height): Subtitles constrained to `68ch` max width, form inputs (`0.9rem`), buttons (`0.88rem`, weight `700`), and table cells (`0.92rem`).
- **Label** (`700`, `0.68rem`–`0.78rem`, `1.2` line-height, `0.03em`–`0.14em` tracking, uppercase): Brand sub-label (`Consola Dex`), national Dex numbers, elemental type badges (`Chakra Petch` `0.7rem`), status pills, telemetry captions, and metric well labels.

### Named Rules
**The Tabular Telemetry Rule.** Every numeric readout that compares quantities—Dex numbers, point budgets, BST/SPE strips, stat values, scores, standings differentials, and K/D ratios—must use `JetBrains Mono` with `font-variant-numeric: tabular-nums` so live updates never cause horizontal layout jitter.

## Layout

The application uses a single-shell viewport layout anchored by a sticky full-width hardware header (`#main-header`, `padding: 0.75rem 1.75rem`) above a centered primary workspace (`max-width: 1440px`, `padding: 1.75rem 1.75rem 3.5rem`). Spacing follows a `4px` base unit scaled across compact `8px` control gaps, `12px` grid gutters, `20px`–`22px` card padding (`1.35rem`), and `28px` workspace gutters (`1.75rem`).

View layouts adapt by operational density:
- **Draft Room (Flagship):** Full-width Active Turn Command Deck above a 2-column asymmetric split (`minmax(0, 1fr)` catalog + `360px` sticky right tactical sidebar at `top: 84px`). The Pokémon catalog uses a fixed-scale responsive grid (`repeat(auto-fill, minmax(195px, 1fr))`, `1rem` gap).
- **Leagues & Matches:** Fluid multi-column grids (`minmax(330px, 1fr)` for league cards; `minmax(360px, 1fr)` for versus battle pods).
- **Rosters & Defensive Coverage:** 4-cell summary deck (`minmax(190px, 1fr)`), Pokémon roster grid (`minmax(245px, 1fr)`), and a rigid 6-column by 3-row 18-type defensive coverage matrix (`repeat(6, minmax(0, 1fr))`).
- **Standings & MVP:** Full-width neomorphic table shell with horizontal scroll container (`overflow-x: auto`).

Responsive breakpoints:
- **`<= 1120px`:** Draft layout collapses to 1 column with static sidebar; coverage matrix steps to 3 columns; navigation dock drops to row 3 inside the header.
- **`<= 768px`:** Sticky header becomes static (`padding: 0.55rem 0.9rem`), navigation dock wraps pills, league/match/form grids collapse to 1 column, and Pokémon catalog cards tighten to `minmax(156px, 1fr)`.
- **`<= 540px`:** 18-type coverage matrix steps to 2 columns.
- **`<= 480px`:** Turn deck, filter dock, and Poké-Slot cards compress padding; circular Poké-Slot well shrinks from `92px` to `66px`; match versus pods stack vertically.

### Named Rules
**The Two-Plane Workspace Rule.** Keep primary catalogs and tactical sidebars aligned on a `1440px` maximum-width deck with `24px` (`1.5rem`) column separation on desktop, collapsing the sidebar strictly below `1120px` so live drafters keep budgets and pick history simultaneously visible on standard monitors.

## Elevation & Depth

PokeDraft Manager uses a **dual-polarity neomorphic hybrid**: convex tactile plates rise above the `#0b0c10` chassis using paired top-left specular highlights and deep bottom-right contact shadows anchored by a `1px` micro-bevel border, while interactive wells, sockets, and telemetry slots carve inward with inverted dark/light inset shadows.

### Shadow Vocabulary
- **Raised Small** (`box-shadow: -3px -3px 7px rgba(255, 255, 255, 0.035), 4px 5px 12px rgba(0, 0, 0, 0.82)`): Default tactile buttons, filter dock, Pokémon draft cards, active nav pill, and header optic lens.
- **Raised Medium** (`box-shadow: -5px -5px 12px rgba(255, 255, 255, 0.038), 7px 9px 20px rgba(0, 0, 0, 0.88)`): Cards, neomorphic panels, turn command deck, toast notifications, and hovered Pokémon cards.
- **Raised Large** (`box-shadow: -7px -7px 18px rgba(255, 255, 255, 0.042), 10px 14px 28px rgba(0, 0, 0, 0.92)`): Hovered league cards and elevated modal dialogs (`backdrop-filter: blur(6px)` behind).
- **Inset Small** (`box-shadow: inset 3px 3px 7px rgba(0, 0, 0, 0.92), inset -2px -2px 5px rgba(255, 255, 255, 0.032)`): Navigation dock track, LED housing, text inputs, selects, coach rows, telemetry wells, coverage tiles, Snake strip, and drafted/disabled card shells.
- **Inset Medium** (`box-shadow: inset 4px 4px 10px rgba(0, 0, 0, 0.95), inset -3px -3px 8px rgba(255, 255, 255, 0.035)`): Circular `92px` Poké-Slot sprite wells.
- **Tactile Press** (`box-shadow: inset 3px 3px 8px rgba(0, 0, 0, 0.9), inset -2px -2px 6px rgba(255, 255, 255, 0.04)`): Active button depression (`translateY(1px)`).
- **Accent Contact Shadows** (`0 6px 16px rgba(0, 0, 0, 0.72)` crimson / `0 6px 16px rgba(0, 0, 0, 0.65)` cyan): Deep ambient grounding beneath primary buttons and hovered Pokémon cards.

### Named Rules
**The Polarity Contrast Rule.** Raised action surfaces (cards, primary/secondary buttons, modals) use convex gradients plus `neo-raised-*` shadows; data-receiving or inactive surfaces (inputs, docks, wells, drafted cards) sink inward using `#08090d` fills plus `neo-inset-*` shadows. Never apply raised shadows to text inputs or inset shadows to clickable primary CTAs.

## Shapes

Geometry balances precision-milled chamfers with circular Pokédex hardware sockets:
- **Micro-badges & Nodes (`6px`):** Elemental type badges, rank pills, Snake queue nodes, and telemetry strips use tight `6px` corners for compact grid alignment.
- **Interactive Controls & Wells (`10px`):** Tactile buttons, concave inputs, selects, toggle chips, coach rows, coverage tiles, and toast notifications share a `10px` radius.
- **Surface Cards & Docks (`14px`):** Standard neomorphic cards, Pokémon draft cards, and filter docks use `14px` corners with `1px` `rgba(255, 255, 255, 0.065)` borders.
- **Command Decks & Modals (`20px`):** Hero turn command decks and overlay dialogs step up to `20px` corners with reinforced `rgba(255, 255, 255, 0.13)` borders.
- **Hardware Pills & Sockets (`9999px` / `50%`):** Navigation docks, status pills, cost badges, Tera pills, segmented docks, stat tracks, and circular Poké-Slot wells (`92px` primary, `38px` mini history socket, `34px` optic lens) use full pill or circular geometry.

## Components

Every interactive surface is tactile, keyboard-accessible (`2px solid #22d3ee` focus-visible ring at `2px` offset), and transitions cleanly with `140ms–210ms` `cubic-bezier(0.22, 1, 0.36, 1)` curves (respecting `prefers-reduced-motion: reduce`).

### Buttons
- **Shape:** Tactile keycap (`10px` radius) with `1px` top-edge bevel border.
- **Primary:** Crimson directional gradient (`#e62938` to `#9e1420`), `#ffffff` bold text, `0.62rem 1.2rem` padding (`0.44rem 0.85rem` small), crimson rose hairline border (`rgba(255, 130, 140, 0.35)`), and `neo-raised-sm` shadow.
- **Hover / Focus:** Lifts `translateY(-1px)` into `#ff3b4a` gradient; `:active` depresses `translateY(1px)` into `neo-press` inset shadow; `:disabled` sinks into a muted `#08090d` inset well.
- **Secondary / Ghost / Danger:** Secondary uses elevated obsidian gradient (`#1b202b` to `#12151d`) with `neo-border-strong`; Ghost stays transparent until `5%` white hover; Danger uses `#dc2626` to `#991b1b` gradient; Icon buttons lock to `34px × 34px`.

### Chips
- **Style:** Elemental type badges combine a `#08090d` tinted well, `6px` radius, `6px` colored circular dot, and uppercase `Chakra Petch` `0.7rem` label. Status pills use `9999px` pill geometry with `JetBrains Mono` `0.7rem` text and a `6px` status dot.
- **State:** League and match statuses map deterministically to Gold (`Preparación`/`Pendiente`), Crimson (`Draft en Vivo`), Emerald (`En Curso`/`Finalizado`), and Muted (`Finalizada`). Toggle filter chips sink into `#08090d` wells and shift their border to cyan when checked.

### Cards / Containers
- **Corner Style:** `14px` radius (`20px` for turn command decks and modals).
- **Background:** Diagonal obsidian gradient (`#161a23` to `#101319`; `#171b25` to `#10131a` on Pokémon cards).
- **Shadow Strategy:** `neo-raised-md` at rest (`neo-raised-sm` on dense Pokémon grid cards); hovers escalate to `neo-raised-lg` on league cards or `translateY(-3px)` + cyan border/shadow on available Pokémon cards. Drafted Pokémon cards sink to `#08090d` inset at `0.48` opacity with `95%` grayscale sprites.
- **Border:** `1px solid rgba(255, 255, 255, 0.065)` (`rgba(255, 255, 255, 0.13)` on modals).
- **Internal Padding:** `1.35rem` on standard cards, `0.95rem` on Pokémon cards, `1.65rem` on modals.

### Inputs / Fields
- **Style:** Recessed concave `#08090d` well, `1px solid rgba(255, 255, 255, 0.07)`, `neo-inset-sm` shadow, `10px` radius, `0.62rem 0.9rem` padding (`2.45rem` left padding when paired with a `search` icon).
- **Focus:** Transitions to `#22d3ee` border plus a `2px` `rgba(34, 211, 238, 0.22)` outer ring layered over the inset shadow.
- **Error / Disabled:** Unaffordable cards mark a subtle crimson border tint (`rgba(230, 41, 56, 0.22)`) while the draft button drops into a disabled inset well.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment:** Sticky obsidian header (`#13161e` to `#0e1016`) edged at the bottom by a `2px` crimson-to-transparent accent line. Left cluster pairs the `34px` radial-gradient cyan optic lens and recessed 3-LED bank (`red`/`gold`/`green`) with the `Chakra Petch` `PokeDraft` / `JetBrains Mono` `Consola Dex` wordmark. Center `nav-dock` recesses the 5 view buttons inside a pill well; active views raise into a `#1e2330`–`#13161f` plate with crimson border and crimson icon tint. Right actions hold the concave league selector (`185px–240px`) and account button with an online/offline emerald LED. Below `1120px`, the dock wraps to row 3; below `768px`, the header unsticks and pills wrap flexibly.

### Signature Components
- **Poké-Slot Draft Card & Socket:** Houses `#0000` Dex number and gold cost pill at top, a `92px` circular concave well (`radial-gradient` from `#121622` to `#07080b`) with pixel-honest sprite scaling (`image-rendering: pixelated` for animated sprites, `scale(1.09)` on hover), type badges, 2-column `BST`/`SPE` monospace telemetry strip, and inspect + draft buttons.
- **Active Turn Command Deck:** A `20px`-radius crimson-bordered command banner showing the crimson turn beacon, active coach/team title, 3 recessed telemetry wells (`Ronda`, `Pick`, `Presupuesto` in gold), Undo Pick control, and a scrollable horizontal Snake queue strip highlighting the current slot in crimson.
- **18-Type Defensive Coverage Matrix & Stat Bars:** `6×3` desktop grid of recessed tiles showing per-type `Resiste` (emerald), `Inmune` (cyan), and `Débil` (light crimson) counts; tiles with `>= 3` weaknesses and `0` resistances/immunities light up with a crimson danger gradient. Stat bars normalize `0–180` across 4 color tiers (`<60` red, `60–89` amber, `90–119` cyan, `>=120` emerald).

## Do's and Don'ts

### Do:
- **Do** preserve the convex-plate vs. concave-well neomorphic contrast (`#12151c` raised cards vs. `#08090d` recessed wells).
- **Do** enforce `JetBrains Mono` with `tabular-nums` on every Dex number, cost, budget, stat, score, and K/D metric.
- **Do** use the custom 24px `1.85` stroke SVG icon set for all UI indicators and keep all copy, labels, and empty states in Spanish.
- **Do** apply `image-rendering: pixelated` to animated sprites while gracefully falling back to smooth static artwork on load failure.
- **Do** highlight keyboard focus with `#22d3ee` (`2px` outline or `0 0 0 2px rgba(34, 211, 238, 0.22)` ring) and honor `prefers-reduced-motion: reduce`.

### Don't:
- **Don't** introduce emojis in navigation, buttons, badges, or headings—use crisp SVG icons exclusively.
- **Don't** use translucent white-glassmorphism SaaS panels or light-mode backgrounds; surfaces stay matte carbon-obsidian.
- **Don't** apply Pokédex Crimson (`#e62938`) to passive informational tags or non-primary buttons; reserve it for turn authority and primary actions.
- **Don't** place raised shadows on text inputs or inset shadows on primary action buttons.
- **Don't** strip the `1px` micro-bevel hairline (`rgba(255, 255, 255, 0.065)`) from dark neomorphic surfaces, as dark-on-dark depth collapses without specular edge definition.
