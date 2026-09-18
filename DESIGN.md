---
name: AtivaWriter Panel
description: Copydesk-table wire editor for drafting email replies from pasted screenshots and text.
colors:
  ink: "#221e18"
  ink-soft: "#4a4335"
  paper: "#efe7d3"
  paper-deep: "#e4d9bf"
  paper-edge: "#d8caa8"
  shell: "#15130f"
  shell-deep: "#0c0b09"
  shell-line: "#322c22"
  shell-text: "#d9d0bd"
  shell-text-dim: "#8d8370"
  pencil-red: "#b23a24"
  pencil-red-deep: "#8f2c1a"
  pencil-red-ink: "#a3341f"
typography:
  display:
    fontFamily: "Oswald, Arial Narrow, sans-serif"
    fontSize: "clamp(1.9rem, 4vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.01em"
  label:
    fontFamily: "Oswald, Arial Narrow, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.09em"
  section-label:
    fontFamily: "Oswald, Arial Narrow, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  body:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  none: "0px"
  pill: "999px"
  circle: "50%"
spacing:
  1: "0.4rem"
  2: "0.8rem"
  3: "1.4rem"
  4: "2.2rem"
  5: "3.2rem"
components:
  stamp-btn-primary:
    backgroundColor: "transparent"
    textColor: "{colors.pencil-red-ink}"
    typography: "{typography.section-label}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.9rem"
  stamp-btn-primary-hover:
    backgroundColor: "color-mix(in srgb, {colors.pencil-red} 8%, transparent)"
    textColor: "{colors.pencil-red-ink}"
    rounded: "{rounded.pill}"
  text-link:
    backgroundColor: "transparent"
    textColor: "{colors.pencil-red-ink}"
    typography: "{typography.label}"
    padding: "0"
  paper-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "2.2rem"
---

# Design System: AtivaWriter Panel

## Overview

**Creative North Star: "The Copydesk Table"**

A wire-service desk under work light: raw dispatch enters at the left, edited copy exits at the right, red-pencil marks show the edit. The system rejects the centered SaaS card with a gradient CTA that every AI writing tool defaults to — there is no card, no gradient, no rounded hero. Instead there is a dark shell (the room) holding a lit sheet of cream newsprint (the desk), stamped and ruled like a physical production floor.

Density is working-tool density: labels are terse and uppercase, textareas carry a faint ruled-paper rhythm, and the one recurring interaction — the circular red-pencil stamp — is reserved for the two actions that actually commit something (submit a login, generate a reply, copy the result). Everything else is flat, quiet, and typewritten.

**Key Characteristics:**
- Dark shell (near-black) containing a lit cream "paper" work surface — not a global light/dark theme swap.
- Pencil-red (#b23a24 family) as the single accent: stamps, focus, error, the printed margin rule.
- Condensed uppercase display face (Oswald) for mastheads/labels; monospace typewriter face (Courier Prime) for all typed content.
- Flat, square-edged panels with a printed masthead rule — never a rounded card.
- Circular/pill stamp buttons (double-ring, rotated) are the only rounded, decorative shape in the system; everything else is right-angled or a hairline rule.

## Colors

Warm newsprint-and-ink palette with a single red accent; the dark shell uses a separate near-black/olive-brown ramp so the desk reads as lit paper inside a dim room, not as a second competing surface.

### Primary
- **Pencil Red** (#b23a24): the single accent — primary stamp buttons, focus rings, the printed margin rule, links, error copy. Deployed only on the paper surface and its controls, never as a shell-level color.

### Neutral — Paper (the desk)
- **Press Ink** (#221e18): primary text on paper, masthead marks, credential marks.
- **Ink Soft** (#4a4335): secondary/meta text on paper — field labels, placeholder italics, sub-heads.
- **Paper** (#efe7d3): the work-surface background (textured with a subtle SVG grain).
- **Paper Deep** (#e4d9bf): paper-surface gradient/rule stop.
- **Paper Edge** (#d8caa8): hairline dividers and input underlines on paper.

### Neutral — Shell (the room)
- **Shell** (#15130f): page background, the dim room the paper sits in.
- **Shell Deep** (#0c0b09): scrollbar track, deepest shell tone.
- **Shell Line** (#322c22): scrollbar thumb, shell-level hairlines (e.g. paperclip glyph).
- **Shell Text** (#d9d0bd): body text if ever rendered directly on the shell.
- **Shell Text Dim** (#8d8370): muted text on the shell.

### Named Rules
**The One Red Rule.** Pencil-red is the only chromatic accent in the system. It never appears as a background fill larger than a button or a thin rule; its job is to mark action and edit, not to decorate area.

**The Lit-Desk Rule.** The dark shell and the cream paper are not alternate themes — the shell is always dark, the paper is always cream. Don't introduce a light-shell variant or a dark-paper variant; the contrast between room and desk is the composition.

## Typography

**Display Font:** Oswald (with Arial Narrow, sans-serif fallback) — self-hosted variable woff2 (weight range 400–700).
**Body Font:** Courier Prime (with Courier New, monospace fallback) — self-hosted, regular/bold/italic 400/700 weights.

**Character:** A condensed slab-style display face reading as agency dateline/masthead type, paired with a genuine typewriter monospace for anything the user or the model "types" — the pairing is what sells the copydesk conceit; body copy never uses the display face and labels never use the type face.

### Hierarchy
- **Display** (700, `clamp(1.9rem, 4vw, 2.6rem)`, line-height 1.1): masthead mark ("ATIVAWRITER") and credential mark on the login sheet.
- **Section Label** (600, 0.95rem, letter-spacing 0.12em, uppercase): panel headers ("DESPACHO RECEBIDO", "NOTAS DA MESA", "COPY APROVADA"), underlined with a paper-edge hairline.
- **Field Label** (600, 0.72rem, letter-spacing 0.09em, uppercase): form field labels above every input/textarea.
- **Body / Typed** (400, 0.98rem, line-height 1.6): all textarea and input content, wire-status readouts, dropzone helper text — always Courier Prime, reads as typed copy.

### Named Rules
**The Typed-vs-Printed Rule.** Anything the person types or the model generates renders in Courier Prime (typed copy). Anything the interface itself prints — labels, masthead, buttons — renders in Oswald uppercase (printed matter). Don't mix the two roles.

## Layout

Single max-width column (980px) centered in the dark shell, generous shell padding (`--space-5` / 3.2rem vertical) framing the paper as an object on a desk. Inside the paper, the main working panel splits into a two-column grid on desktop (`1.6fr / 1fr`: wide "Despacho Recebido" column for the pasted print/text, narrower "Notas da Mesa" column for stacked reference note-cards), collapsing to a single stacked column under 860px. The generated-reply panel is a second, independently rotated paper sheet below the main one, not a modal or inline reveal. Spacing follows a five-step rem scale (0.4 / 0.8 / 1.4 / 2.2 / 3.2rem) used consistently for label gaps, field-block stacking, and panel padding. Mobile is explicitly not a priority per PRODUCT.md; the responsive rule only re-stacks the grid and tightens shell/paper padding.

## Elevation & Depth

Flat by default with two soft, ambient drop shadows carrying the "sheet resting on a desk" read — this is not a neobrutalist world and does not use hard offset shadows or outlined borders as a depth device. The paper panels and the login credential card each cast one diffuse, large-blur shadow beneath them (no visible offset direction, no border-based shadow); everything else on the paper (labels, dividers, textareas) is flat with hairline rules only.

### Shadow Vocabulary
- **Panel rest** (`box-shadow: 0 24px 48px -28px rgba(0,0,0,0.75), 0 4px 10px -4px rgba(0,0,0,0.5)`): under `.paper` panels, both main and result sheets.
- **Credential rest** (`box-shadow: 0 28px 56px -30px rgba(0,0,0,0.8), 0 6px 14px -6px rgba(0,0,0,0.5)`): under the login credential card, slightly heavier than the panel shadow to read as the sole focal object on screen.
- **Preview thumbnail** (`box-shadow: 0 6px 14px -6px rgba(0,0,0,0.5)`): under each clipped image-preview thumbnail.

### Named Rules
**The Desk-Light Rule.** Shadows are always soft, large-blur, and directionless (ambient light from above), never a hard offset block shadow. Depth reads as "paper resting under work light," not as a graphic outline.

## Shapes

Right angles by default: paper panels, textareas, dropzones, and note-cards all have 0 border-radius — they are cut sheets, not rounded cards. The one deliberate exception is the stamp motif: primary actions (`Gerar resposta`, `Entrar`, `Copiar`) and the login access mark use a pill or full circle (999px / 50%) with a double-ring border (an outer 2px ring plus an inset 1px ring at 55% opacity) and a slight counter-rotation (-1.4° to -2°, corrected to 0° on press), reproducing a hand-struck rubber stamp. Image-preview thumbnails are unrounded squares, individually rotated a few degrees to read as clipped, slightly askew photos, with an inline SVG paperclip glyph pinned at the top edge. Dividers throughout are 1–2px hairline rules (`--paper-edge`, `--ink`), never a card border.

### Named Rules
**The Stamp-Is-Special Rule.** Circular/pill shapes and rotation are reserved for the stamp button family and the image-preview clip stack. No other component (cards, inputs, nav, labels) is ever rounded or rotated — the stamp motif stays legible as a signature, not a general corner-radius default.

## Components

### Buttons
- **Shape:** pill (`border-radius: 999px`) with an inset double ring (outer 2px solid border + inset 1px ring at 3px offset, 55% opacity) — the rubber-stamp impression. Slight rest rotation (`-1.4deg` large / `-2deg` default).
- **Primary (`.stamp-btn`):** transparent background, `pencil-red-ink` (#a3341f) text and border, uppercase Oswald 700, letter-spacing 0.06em. Padding `0.75rem 1.9rem` (default) / `0.95rem 2.6rem` (`--lg`, used for "Gerar resposta").
- **Hover:** background fills to `color-mix(in srgb, pencil-red 8%, transparent)`; no scale or shadow change.
- **Active:** rotation resets to 0deg, scales to 0.94, and gains a soft red glow ring (`box-shadow: 0 0 0 6px rgba(178,58,36,0.12)`) — the "stamp strike."
- **Disabled:** border/text drop to `paper-edge` / `ink-soft`, rotation resets, no interaction affordance.
- **Ghost (`.text-link`):** no border/background, Oswald uppercase label size, dotted underline, `pencil-red-ink` text (or `ink-soft` for the `--muted` variant, e.g. "Nova resposta" / "Sair").

### Cards / Containers
- **Corner Style:** square (0 radius) throughout — `.paper`, `.credential`, `.note-card`.
- **Background:** `paper` (#efe7d3) with a subtle fractal-noise SVG grain texture at very low opacity; note-cards inherit the paper panel, no separate fill.
- **Shadow Strategy:** see Elevation & Depth — ambient panel-rest shadow, no borders.
- **Border:** none on the panel edge itself; a 2px `ink` rule under the masthead, and a 1px `pencil-red` margin rule (35% opacity) running the full panel height near the left edge — the "copydesk margin," not a UI border.
- **Internal Padding:** `--space-4` (2.2rem) on three sides, extra `1.4rem` on the left to clear the printed margin rule; `--space-3` (1.4rem) on mobile.

### Inputs / Fields
- **Style:** `.typed-input` is bare — no fill, bottom hairline only (`1px solid paper-edge`). `.typed-textarea` adds a full 1px `paper-edge` border, a faint horizontal ruled-line background (`linear-gradient` every 1.85em) to mimic ruled paper, and left padding cleared for the margin rule. Both render in Courier Prime.
- **Focus:** browser-default focus-visible replaced globally with a 2px `pencil-red-ink` outline, 3px offset — consistent everywhere, not per-component.
- **Error / Disabled:** error copy uses `.marginal-note` — `pencil-red` bordered block with an auto-prefixed "ERRO —" label in Oswald bold; not a per-field inline error state.

### Navigation
No persistent nav bar; the masthead (`.masthead`) stands in for navigation — uppercase Oswald wordmark, a live `Courier Prime` wire-clock (tabular numerals, auto-updating), and a single `.text-link` sign-out action, all separated from the panel body by a 2px `ink` rule.

### Stamp Button (signature component)
The one recurring bespoke interaction, used for every commit-style action (login submit, generate, copy): double-ring circular/pill border, slight rotation, uppercase condensed label, rotation-reset-plus-glow on press. Never used for secondary or destructive actions — those stay ghost text-links.

## Do's and Don'ts

### Do:
- **Do** keep pencil-red (#b23a24 / #a3341f) as the only chromatic accent; every other surface stays ink/paper/shell neutrals.
- **Do** render all typed/generated content in Courier Prime and all interface-printed labels/headers in Oswald uppercase — never swap the two roles.
- **Do** use the double-ring pill/circle stamp shape only for primary commit actions (submit, generate, copy); keep every other shape square or hairline-ruled.
- **Do** keep shadows soft, large-blur, and directionless (ambient desk light); never a hard offset block shadow.

### Don't:
- **Don't** round or shadow-elevate ordinary containers (panels, note-cards, textareas, dropzones) — they are cut paper sheets, flat and square, not cards.
- **Don't** introduce a light-shell/dark-paper inversion; the dark shell and cream paper are fixed, not a theme toggle (product confirmed single dark theme).
- **Don't** add icon-font or emoji glyphs; the system's only icons are the four inline SVG symbols already defined (upload, x/remove, stamp-check, paperclip) — extend by adding new inline SVGs in the same line-icon style, not a font.
- **Don't** add a Google-Fonts or other third-party CDN font link; both faces are self-hosted under `/fonts` to keep the no-build, single-container deploy constraint intact.
