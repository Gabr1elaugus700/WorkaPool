---
name: WorkaPool
description: Internal operations and commercial workspace with high-signal green accents.
colors:
  primary: "hsl(var(--primary))"
  primary-foreground: "hsl(var(--primary-foreground))"
  background: "hsl(var(--background))"
  foreground: "hsl(var(--foreground))"
  card: "hsl(var(--card))"
  card-foreground: "hsl(var(--card-foreground))"
  muted: "hsl(var(--muted))"
  muted-foreground: "hsl(var(--muted-foreground))"
  border: "hsl(var(--border))"
  ring: "hsl(var(--ring))"
  destructive: "hsl(var(--destructive))"
  destructive-foreground: "hsl(var(--destructive-foreground))"
  order-mine: "hsl(var(--order-mine))"
  order-other: "hsl(var(--order-other))"
  order-blocked: "hsl(var(--order-blocked))"
  order-nostock: "hsl(var(--order-nostock))"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.01em"
rounded:
  sm: "calc(var(--radius) - 4px)"
  md: "calc(var(--radius) - 2px)"
  lg: "var(--radius)"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "hsl(var(--primary) / 0.9)"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: WorkaPool

## Overview

**Creative North Star: "The Operations Greenroom"**

The system is built for operational throughput and commercial analysis, so visual language prioritizes legibility, predictable interactions, and fast scanability over ornamental expression. Neutral canvases hold most of the interface while a single green family marks action, progress, and ownership.

Interaction hierarchy is explicit: surfaces stay quiet at rest, then state changes surface intent through focused rings, hover contrast shifts, and selective elevation. Component behavior is confident and pragmatic, with concise geometry and restrained transitions that make workflows feel dependable under sustained daily use.

Only one anti-reference is explicit: avoid gamified visuals with excessive saturation, decorative badges, or attention-seeking ornament that competes with task-critical information.

**Key Characteristics:**
- Neutral-first interface with controlled green signal accents.
- Flat-by-default surfaces with state-driven depth.
- Medium corner system and compact spacing rhythm.
- Utility-first component vocabulary with consistent field and card anatomy.

## Colors

The palette is role-driven: one accent family for action and status, anchored by muted neutrals for reading-heavy screens.

### Primary
- **Signal Green** (`hsl(var(--primary))`): primary CTA surfaces, active emphasis, focus-ring family, and chart accents where positive action or progress must stand out.

### Secondary
- **Soft Support Gray** (`hsl(var(--secondary))`): secondary fills and low-emphasis surfaces that separate structure without stealing attention.

### Tertiary
- **Subtle Accent Mist** (`hsl(var(--accent))`): hover and lightweight contextual highlights used to acknowledge interaction.

### Neutral
- **Mist White** (`hsl(var(--background))`): default application canvas and broad background fields.
- **Pure Card White** (`hsl(var(--card))`): card and popover containers for content segmentation.
- **Graphite Slate** (`hsl(var(--foreground))`): primary text and icon foreground for high readability.
- **Fog Gray** (`hsl(var(--muted-foreground))`): secondary labels, helper copy, and table meta information.
- **Quiet Divider** (`hsl(var(--border))`): border strokes for controls, cards, and structured data regions.

### Named Rules (optional, powerful)
**The Single Accent Channel Rule.** Green carries action authority; additional vivid accents are reserved for semantic states, never for decorative novelty.

## Typography

**Display Font:** Inter (with `sans-serif` fallback)  
**Body Font:** Inter (with `sans-serif` fallback)  
**Label/Mono Font:** Inter for labels; no dedicated mono track is defined in the incumbent system.

**Character:** Geometric-humanist sans typography tuned for operational readability, with medium-to-strong weight contrasts and conservative tracking.

### Hierarchy
- **Display** (700, `2rem`, 1.2): large entry headings such as auth and key section intros.
- **Headline** (700, `1.25rem`, 1.25): navigation brand mark and high-priority heading rows.
- **Title** (600, `1.125rem`, 1.35): card section titles and block-level emphasis.
- **Body** (400, `0.875rem`, 1.5): primary reading text, table cells, and standard UI copy.
- **Label** (500, `0.75rem`, 1.35, `0.01em` letter spacing): compact metadata and control labels.

### Named Rules (optional)
**The Workhorse Type Rule.** Keep the interface in one family and drive hierarchy by size, weight, and spacing rather than switching faces.

## Layout

Layout follows a container-centered web app pattern (`container mx-auto`) with flexible vertical composition (`flex`, `grid`) and dense but readable spacing steps (`0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`). Data-heavy sections favor single-column on small screens and pivot to two-column or tabular structures from medium breakpoints (`md`) upward. Mobile navigation is bottom-docked for direct thumb access, while desktop uses a persistent top navigation strip.

## Elevation & Depth

Depth is mostly stateful. Default surfaces are visually flat and rely on borders and tonal separation; shadows appear as light structural hints on cards and stronger overlays for dialogs/toasts. This keeps baseline noise low while still giving users immediate feedback during interaction and focus shifts.

### Shadow Vocabulary (if applicable)
- **Surface Hint** (`shadow-sm`): lightweight separation for cards and grouped content regions.
- **Overlay Lift** (`shadow-lg`): modal dialogs and toast notifications where foreground priority must be explicit.

### Named Rules (optional)
**The Flat-by-Default Rule.** Surfaces remain flat at rest; elevation is introduced only when state or layering demands it.

## Shapes

The form language uses a medium radius core anchored on `--radius` (`0.65rem`) and derived steps for control density: small (`calc(var(--radius) - 4px)`), medium (`calc(var(--radius) - 2px)`), and large (`var(--radius)`). Pills are reserved for badges/tags (`rounded-full`). Borders are thin and neutral; clipping and geometric novelty are intentionally absent to keep operational clarity first.

## Components

Components read as confident and pragmatic: clear boundaries, stable hit targets, and predictable interaction states.

### Buttons
- **Shape:** medium rounded controls (`calc(var(--radius) - 2px)`), icon buttons in square frames.
- **Primary:** green fill with contrasting foreground (`hsl(var(--primary))` + `hsl(var(--primary-foreground))`) and compact horizontal padding (`1rem`).
- **Hover / Focus:** hover uses controlled alpha shift; focus uses a visible ring (`hsl(var(--ring))`) plus offset for keyboard readability.
- **Secondary / Ghost / Link:** secondary and ghost remain neutral; link style is text-first for nav contexts.

### Chips (if used)
- **Style:** rounded-pill (`9999px`) with semantic fills (primary, secondary, destructive) and compact label typography.
- **State:** hover reduces opacity/saturation subtly; no animated flourish.

### Cards / Containers
- **Corner Style:** large rounded container (`var(--radius)`).
- **Background:** card-white surface on mist-white page canvas.
- **Shadow Strategy:** flat by default with `shadow-sm` as separation hint.
- **Border:** neutral single-line stroke for structure.
- **Internal Padding:** usually `1.5rem`, with section-specific reductions for dense data blocks.

### Inputs / Fields
- **Style:** neutral background with border stroke, medium radius, and fixed `2.5rem` control height.
- **Focus:** ring + offset treatment mirrors button focus behavior for consistency.
- **Error / Disabled:** destructive text for errors and opacity/pointer constraints for disabled state.

### Navigation
- **Style:** desktop top bar in primary green with foreground links; mobile bottom nav in white with active-green icon/text states and neutral inactive states.

### Overview Section Card
Reusable analytics section wrapper with card shell, compact heading stack, optional supporting description, and content-first interior region for KPI grids/charts/tables.

## Do's and Don'ts

Concrete guardrails derived from the incumbent implementation:

### Do:
- **Do** keep green as the singular high-signal action channel and rely on neutrals for base surfaces.
- **Do** use visible focus rings with offset on interactive controls to preserve keyboard traceability.
- **Do** keep table and KPI typography compact (`text-sm` and below) with clear muted-vs-primary contrast.
- **Do** preserve medium-radius geometry and avoid mixing many corner systems on the same screen.

### Don't:
- **Don't** introduce gamified visual noise (over-saturated badges, excessive celebration colors, or decorative motion) in operational screens.
- **Don't** stack deep shadows on resting surfaces; reserve strong elevation for overlays and transient feedback.
- **Don't** use low-contrast gray-on-gray text for KPI labels and metadata.
