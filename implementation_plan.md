# Modern 2026 Board-Game Aesthetic Redesign

Give Stop Trivia a fresh, premium "2026 board game" look — tactile surfaces, rich deep jewel-tone colours, elevated typography, glassmorphism card layering, and fluid micro-animations — while keeping the board-game spirit alive.

## Design Vision

| Pillar | Current | Target |
|---|---|---|
| Colour palette | Deep teal `#008080` on near-black | Rich jewel-toned `#00C9A7` / `#7C3AED` neon-teal & violet on ultra-dark `#070B14` |
| Typography | Onest 400 / 800 | Onest (same, but tighter letter-spacing, size hierarchy, caps labels) |
| Surfaces | Flat `#001514` cards | Frosted-glass cards with `rgba` fills, luminous 1 px border strokes, inner glows |
| Gradients | Simple 2-stop linear | Radial ambient glows behind hero elements + layered card shimmer |
| Tab bar | Small pill on `#001514` | Wider floating pill with blur/glass look & coloured active indicator |
| Buttons | Flat text inside a tinted pill | Raised pill with gradient stroke border + ripple glow on press |
| Section headers | Plain `h2` text | All-caps label with a coloured left-bar accent |
| Modal | `#001c1a` flat box | Glassmorphism sheet with soft drop shadow |
| Status accents | Single teal for all states | Teal = primary, Violet = game-type, Amber = warnings, Emerald = success |

## Proposed Changes

---

### 1. Design Tokens — `constants/Theme.ts`

#### [MODIFY] [Theme.ts](file:///c:/Dev/RN/stop-trivia/constants/Theme.ts)

Expand the colour set to the new jewel-tone palette and add new semantic tokens (`glow`, `surface`, `surfaceBorder`, `neon`, etc.). All existing token names remain so no other files break.

---

### 2. Core UI Primitives

#### [MODIFY] [Screen.tsx](file:///c:/Dev/RN/stop-trivia/components/ui/Screen.tsx)

Add a subtle radial ambient glow overlay behind content (pure decorative `View` with a radial gradient).

#### [MODIFY] [Divider.tsx](file:///c:/Dev/RN/stop-trivia/components/Divider.tsx)

Upgrade to a gradient divider that fades out at the edges.

#### [MODIFY] [FocusInput.tsx](file:///c:/Dev/RN/stop-trivia/components/FocusInput.tsx)

- Glass-style background (`rgba` instead of flat colour)
- Focus border: animated teal glow (shadowColor + borderColor together)
- Slightly taller padding, softer placeholder colour

---

### 3. Interactive Components

#### [MODIFY] [ModesButton.tsx](file:///c:/Dev/RN/stop-trivia/components/ModesButton.tsx)

- Replace flat `LinearGradient` overlay with a multi-layer approach:
  1. Background image (unchanged)
  2. Dark vignette gradient from left (unchanged)
  3. **New:** a 1 px luminous border via `borderWidth: 1, borderColor: rgba(0,201,167,0.3)` + outer glow via `elevation`/`shadowColor`
- Increase corner radius to 28 for a more premium tablet-game card feel
- Reduce card background opacity so the image peeks through more
- Title: tighter letter-spacing; subtitle: slightly smaller & muted indigo-gray
- The `isNew` badge: switch from plain `#008080` to a hot violet-to-teal diagonal gradient

#### [MODIFY] [BottomSheetModal.tsx](file:///c:/Dev/RN/stop-trivia/components/BottomSheetModal.tsx)

- Background: deeper modal colour `#0A0F1E` (new token)
- Handle indicator: teal glow colour
- Title row: add a small coloured left accent bar before the title

#### [MODIFY] [TabBarButton.tsx](file:///c:/Dev/RN/stop-trivia/components/TabBarButton.tsx)

- Active icon: scale up more prominently and add a teal dot indicator below it
- Label: hide when focused (the icon speaks for itself)

#### [MODIFY] [TabBar.tsx](file:///c:/Dev/RN/stop-trivia/components/ui/TabBar.tsx)

- Glass pill background via `rgba(10,15,30,0.85)` + `borderColor: rgba(0,201,167,0.2)`
- Active background indicator: teal pill with soft glow
- Widen the max pill width to accommodate the new look

---

### 4. Screens

#### [MODIFY] [app/(tabs)/index.tsx](file:///c:/Dev/RN/stop-trivia/app/(tabs)/index.tsx)

- Section header "Online Modes": wrap in a styled header row with an accent bar, all-caps label style
- Modal (time selector): upgrade to glassmorphism card — `rgba` background, luminous border, backdrop blur effect using a semi-transparent overlay
- Time-selector buttons: full-width stacked layout instead of a horizontal row for better touch targets; each with a left-side colour accent
- Bottom sheet join-game items: upgrade to glass card rows with a right arrow icon that glows on press

#### [MODIFY] [app/_layout.tsx](file:///c:/Dev/RN/stop-trivia/app/_layout.tsx)

- Stack header: increase `headerTitleStyle` letter-spacing; replace plain cog with a glass icon button (circular `rgba` background)

---

### 5. Login & Onboarding

#### [MODIFY] [components/LoginForm.tsx](file:///c:/Dev/RN/stop-trivia/components/LoginForm.tsx)

- Input fields: glass style (matching upgraded `FocusInput`)
- Sign-in button: full-width gradient pill (`#00C9A7` → `#7C3AED`)
- Google button: outlined glass pill
- Error text: styled with a left-bar red accent

#### [MODIFY] [components/Onboarding.tsx](file:///c:/Dev/RN/stop-trivia/components/Onboarding.tsx)

- Active dot: wider + teal glow
- Inactive dots: semi-opaque glass

---

## Verification Plan

### Manual Verification
- Run `npx expo start` and test on Android emulator / device
- Verify all screens look correct in light of the new palette
- Confirm no regressions in interactive behaviour (pressing, animations, bottom sheet)
- Check that the ad banner and safe-area insets are still properly handled in the tab bar

> [!NOTE]
> No logic changes are made — only visual/style properties. The refactor is entirely additive to the `Theme` token set; all files keep the same structure and functionality.
