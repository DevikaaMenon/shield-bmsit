# DESIGN.md — Avengers Command ("Field Manual")

Rules followed on every UI change in this repo. If a change breaks one, the change is wrong.

## Direction
**Brutalist-Technical.** A declassified S.H.I.E.L.D. field manual: one flat bone panel floating over a live ink-black 3D world (the threat globe). Raw rules, exposed grid, expanded type, mono spec data. Motion is smooth and weighty: `expo.out`/`power3` eases, inertial (Lenis) scrolling, elastic recoil on hits — fast but never stepped or janky. The 3D world is a NASA night-lights Earth with an atmosphere rim.

Reference cues (Dribbble motion piece): flat single-colour panel over a 3D scene · thin HUD rule with a triangle marker · left index where the active item is an outlined box · compact bold uppercase headline blocks · image strips with **stepped pixel-cut ends** · tiny multi-column body text.

## Fonts
| Role | Family | Use |
|---|---|---|
| Display | **Big Shoulders Display** variable (100–900), condensed | weight **800** headlines, weight **200** counterpoint lines |
| Body | **Instrument Sans** 400 / 600 | paragraphs, buttons |
| Mono | **JetBrains Mono** 400 / 700 | labels, data, coordinates, logs |

**Never use:** Inter, Roboto, Open Sans, Arial, system-ui, Montserrat, Archivo Expanded, IBM Plex.

## Color — one dominant, one accent
```css
--color-bone:   #EDEAE3;  /* DOMINANT — the panel/paper */
--color-ink:    #0E0E0E;  /* neutral — text, rules, the 3D world */
--color-marvel: #EC1D24;  /* ACCENT — the only colour */
```
Tints are allowed only as `ink/xx` or `marvel/xx` opacity. **Character art is the only place full colour may appear** (on hover, selection, battle, dossier). No other UI hues — threat and status are encoded by **fill density + label**:

| Threat | Mark |
|---|---|
| OMEGA | solid red block |
| HIGH | red diagonal hatch |
| MEDIUM | red outline |
| LOW | ink outline |

Status: Pending = ink outline · In Progress = red fill · Completed = ink, struck through.

**Banned:** purple/indigo gradients, any gradient as decoration, glow, glassmorphism, blur.

## Spacing & type scale
- 8px rhythm: 8 · 16 · 24 · 32 · 48 · 64 · 96 · 144. Tailwind `2 4 6 8 12 16 24 36`.
- Type sizes jump ~3x: **11px** mono labels → **16px** body → **48px** section headings → **144px** (clamp) hero/numerals.
- Weight extremes only: 200 vs 800 for display. No 500/600 display.
- Rules: 1px `ink/20` for grid lines, 2px `ink` for structure.
- Corners: **0** radius everywhere (circles only for avatars dots).
- Shadow: only `6px 6px 0 var(--color-ink)` (`.slab`). Never soft shadows.

## Components (reuse, don't hand-roll)
No shadcn/ui is installed — these are the project's primitives.

| Import | What |
|---|---|
| `src/components/ui.tsx` → `useReveal` | GSAP `fromTo` reveal for `[data-reveal]` children |
| `ui.tsx` → `SectionHeader` | index number + 800/200 heading + note column |
| `ui.tsx` → `ThreatMark`, `StatusMark` | density-coded threat / status labels |
| `ui.tsx` → `StatBar`, `Counter`, `Portrait`, `Toast`, `Scramble` | bars, tweened numbers, duotone images w/ fallback, comms toast, scramble text |
| `src/components/StepImage.tsx` | image strip with stepped pixel-cut ends |
| `src/components/Navbar.tsx` → `Navbar`, `Logo` | HUD rule + index |
| `src/components/HeroCard.tsx` | roster row/tile |
| `src/components/Dossier.tsx` | spec-sheet modal |
| `src/components/ThreatGlobe.tsx` | fixed 3D world |
| CSS: `.slab .rule .hatch .btn .btn-red .label .display .stepcut` | in `src/index.css` |

## Forbidden
- Three rounded cards in a row (or any rounded cards).
- Centered-everything heroes — everything is left-aligned to the grid.
- 0.1-opacity drop shadows on everything.
- Borders-and-boxes everywhere: hierarchy comes from type size/weight and space first, rules second.
- Lorem ipsum / "Feature one". All copy is real mission content.
- CSS `opacity`/`transform` transitions on elements GSAP animates (causes stuck-at-0 reveals under StrictMode). Use `gsap.fromTo`.

## Logos & art
`public/logos/` holds the Marvel wordmark and Avengers "A" (Wikimedia Commons). Character art comes from the superhero-api CDN, shown grayscale-multiply on bone with a red duotone on hover. Non-commercial fan/hackathon use; footer credits Marvel as trademark owner.
