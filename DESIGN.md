---
name: WorkaPool
description: Internal operations console for Pool Técnica — practical, scanable, green-accented task UI.
colors:
  primary: "hsl(143.3 80.6% 45.1%)"
  primary-foreground: "hsl(355.7 100% 97.3%)"
  background: "hsl(0 0% 97%)"
  foreground: "hsl(220 20% 10%)"
  card: "hsl(0 0% 100%)"
  card-foreground: "hsl(220 20% 10%)"
  muted: "hsl(240 4.8% 95.9%)"
  muted-foreground: "hsl(240 3.8% 46.1%)"
  border: "hsl(240 5.9% 90%)"
  input: "hsl(240 5.9% 90%)"
  ring: "hsl(142.1 76.2% 36.3%)"
  destructive: "hsl(0 84.2% 60.2%)"
  destructive-foreground: "hsl(0 0% 98%)"
  carga-aberta: "#A7F3D0"
  carga-solicitada: "#FDE047"
  carga-fechada: "#16A34A"
  carga-cancelada: "#DC2626"
  order-mine: "hsl(160 55% 35%)"
  order-mine-bg: "hsl(160 55% 92%)"
  order-blocked: "hsl(0 72% 51%)"
  order-blocked-bg: "hsl(0 72% 95%)"
  order-nostock: "hsl(30 90% 50%)"
  order-nostock-bg: "hsl(30 90% 94%)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  base: "0.65rem"
  md: "calc(0.65rem - 2px)"
  sm: "calc(0.65rem - 4px)"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.base}"
    padding: "24px"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: WorkaPool

## Overview

**Creative North Star: "The Operations Console"**

WorkaPool looks and behaves like a control room for daily operations—not a marketing site. Surfaces are light, information-dense, and organized around recurring jobs (cargas, pedidos, OS, metas). A confident **Pool Green** (`hsl(143.3 80.6% 45.1%)`) signals brand and primary action, while page bodies stay neutral so tables, cards, and status chips carry most of the visual signal.

The stack is **shadcn/ui + Radix** on Tailwind CSS variables (`frontend/src/styles/tailwind.css`, `frontend/tailwind.config.js`). Inter is the sole type family. Layout follows a desktop top bar + mobile bottom tab pattern (`DefaultLayout`). Polish is functional: borders, `shadow-sm`, and ring focus states—not decorative motion or hero imagery.

**Key Characteristics:**

- Operate-mode density: tables, forms, and cards over empty marketing space
- Green structural chrome (navbar) on neutral work surfaces
- Semantic domain colors for **Carga** lifecycle and **order** negotiation states
- shadcn component variants as the default extension point—not one-off inline styling
- Portuguese (BR) labels with domain-precise terminology

## Colors

A practical green-accent palette on cool neutrals, with reserved semantic hues for logistics and commercial status.

### Primary

- **Pool Green** (`hsl(143.3 80.6% 45.1%)`): Brand bar, primary buttons, active wayfinding accents, chart emphasis. The app's signature hue.
- **On Primary** (`hsl(355.7 100% 97.3%)`): Text and links on the green navbar; ghost nav actions.

### Neutral

- **Console Canvas** (`hsl(0 0% 97%)`): Page background (`bg-background`).
- **Ink** (`hsl(220 20% 10%)`): Primary body text (`text-foreground`).
- **Surface** (`hsl(0 0% 100%)`): Cards, inputs, mobile bottom nav.
- **Muted Field** (`hsl(240 4.8% 95.9%)`): Login backdrop, secondary fills.
- **Muted Label** (`hsl(240 3.8% 46.1%)`): Placeholders, descriptions, footer text.
- **Hairline** (`hsl(240 5.9% 90%)`): Borders and input strokes.

### Tertiary (domain semantics)

- **Carga Aberta** (`#A7F3D0`): Open load — early lifecycle.
- **Carga Solicitada** (`#FDE047`): Requested load — in progress.
- **Carga Fechada** (`#16A34A`): Closed load — complete.
- **Carga Cancelada** (`#DC2626`): Cancelled load — terminal error.
- **Order Mine** (`hsl(160 55% 35%)` / bg `hsl(160 55% 92%)`): User-owned negotiation cards.
- **Order Blocked** (`hsl(0 72% 51%)` / bg `hsl(0 72% 95%)`): Blocked or lost-with-urgency states.
- **Order No Stock** (`hsl(30 90% 50%)` / bg `hsl(30 90% 94%)`): Stock-related warnings.

### Named Rules

**The Green Bar Rule.** The full-width primary navbar is the only large-field green surface. Page content stays neutral; green appears in buttons, badges, and status chips—not full-bleed section backgrounds.

**The Status Color Rule.** Carga and order states use their dedicated tokens (`carga-*`, `order-*`). Do not improvise new hues for ABERTA, FECHADA, perdido, or bloqueado.

## Typography

**Display Font:** Inter (with `sans-serif` fallback)
**Body Font:** Inter (with `sans-serif` fallback)
**Label Font:** Inter (same family; weight/size differentiate roles)

**Character:** Neutral, legible, and slightly compact—optimized for scanning tables and form labels in Portuguese. No display serif or expressive pairing.

### Hierarchy

- **Display** (700, 1.5rem / 24px, line-height 1.2): Navbar wordmark "WorkaPool", rare page titles.
- **Title** (600, 1.5rem / 24px, line-height 1, tracking-tight): Card titles (`CardTitle`), login heading.
- **Body** (400, 0.875rem / 14px on md+, 1rem / 16px on mobile inputs, line-height 1.5): Default UI copy, table cells, form text. Prefer 65–75ch for long prose blocks when they appear.
- **Label** (500, 0.75rem / 12px): Mobile tab labels, badge text, compact metadata.

### Named Rules

**The One Family Rule.** Inter carries every role. Do not introduce a second typeface without explicit brand approval.

## Layout

- **Shell:** `min-h-screen flex flex-col` with `container mx-auto` content (`max-width` follows Tailwind `container` defaults).
- **Desktop (md+):** Top primary navbar (`hidden md:block`), main padding `p-4`, footer with version line.
- **Mobile (<md):** Fixed bottom tab bar (`pb-24` on main to clear it); three primary destinations (Home, Vistorias, Ordens).
- **Spacing rhythm:** 4px base grid via Tailwind—`gap-4` / `p-4` (16px) for page sections; `p-6` (24px) inside cards.
- **Density:** Operate-first; prefer stacked sections and scrollable tables over sparse hero layouts.

## Elevation & Depth

Mostly **flat with light lift**. Depth is conveyed through white cards on a gray canvas, 1px borders, and occasional `shadow-sm`—not layered floating panels.

### Shadow Vocabulary

- **Card rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Default cards (`shadow-sm`).
- **Navbar** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)`): Structural separation under the green bar.
- **Dialog** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1)`): Modal content (`shadow-lg`); overlay `bg-black/80`.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear on cards, modals, and the navbar—not on every list row or table cell.

## Shapes

- **Base radius** (`0.65rem` / ~10px): CSS variable `--radius`; drives `rounded-lg` on cards and `rounded-md` on inputs/buttons via Tailwind calc offsets.
- **Pills:** Badges use `rounded-full`.
- **Borders:** 1px `border` / `border-input` on inputs, cards, and tables; no heavy outlines.
- **Dialogs:** `sm:rounded-lg` on modal content; square on very small viewports.

## Components

### Buttons

- **Character:** Confident and utilitarian—filled green for primary actions, outline/ghost for secondary and nav.
- **Shape:** `rounded-md` (~8px), height 40px default (`h-10`), 36px small (`h-9`), 44px large (`h-11`).
- **Primary:** `bg-primary` with `hover:bg-primary/90`; note incumbent override `text-black` on default variant.
- **Outline:** `border border-input bg-background`, hover `bg-accent`.
- **Ghost:** Used in navbar for "Sair"; `text-primary-foreground` on green bar.
- **Link:** `text-primary underline-offset-4` for inline text actions.
- **Focus:** `ring-2 ring-ring ring-offset-2`.

### Chips / Badges

- **Style:** `rounded-full`, `text-xs font-semibold`, `px-2.5 py-0.5`.
- **Default:** Primary fill; secondary/destructive/outline variants match shadcn patterns.
- **Domain:** Prefer semantic `carga-*` / `order-*` backgrounds for status—not generic gray.

### Cards / Containers

- **Corner Style:** `rounded-lg` (0.65rem).
- **Background:** `bg-card` on `bg-background` pages.
- **Shadow:** `shadow-sm` at rest.
- **Border:** `border` hairline optional; login card uses border implicitly via card styles.
- **Internal Padding:** `p-6` header/content standard.

### Inputs / Fields

- **Style:** `h-10`, `rounded-md`, `border-input`, `bg-background`, `px-3 py-2`.
- **Placeholder:** `text-muted-foreground`.
- **Focus:** `ring-2 ring-ring ring-offset-2`, no glow.
- **Error:** `text-destructive` message below field (login pattern).

### Navigation

- **Desktop:** Full-width `bg-primary text-primary-foreground shadow` bar; `ButtonLink` renders `variant="link"` items in white; role-gated visibility.
- **Mobile:** Fixed bottom white bar, `border-t border-primary/20`; active tab `text-green-600`, inactive `text-slate-500`; Lucide icons 24px with `text-xs` labels.
- **Typography:** Navbar wordmark `text-xl font-bold text-white`.

### Tables

- **Style:** `text-sm`, full-width with horizontal scroll wrapper; header row `border-b`; zebra not used—rely on row borders.

### Dialogs

- **Overlay:** `bg-black/80` fade animation.
- **Content:** Centered, `max-w-lg`, `p-6`, `shadow-lg`, zoom/slide entrance via `tailwindcss-animate`.

## Do's and Don'ts

### Do:

- **Do** use semantic tokens (`primary`, `muted`, `destructive`, `carga-*`, `order-*`) via Tailwind classes or `hsl(var(--token))`.
- **Do** keep labels and headings in Portuguese with domain terms from `CONTEXT.md` files.
- **Do** extend shadcn variants (`Button`, `Badge`, `Card`) before creating bespoke styled divs.
- **Do** preserve the green navbar + neutral body pattern on new authenticated screens.
- **Do** use `container mx-auto p-4` and bottom padding on mobile when adding fixed footers.

### Don't:

- **Don't** introduce marketing-style hero sections, gradients, or decorative illustration in operational views.
- **Don't** assign new arbitrary colors to Carga or order states—use the established semantic palette.
- **Don't** add a second global stylesheet with competing `:root` tokens (`globals.css` vs `tailwind.css`—`main.tsx` loads `tailwind.css` as authority).
- **Don't** hide critical actions behind icon-only buttons without tooltips or labels.
- **Don't** use English UI copy on staff-facing surfaces unless mirroring an established ERP field name.
