# AGENTS.md

## Stack

- Expo SDK 54, React Native 0.81.4, React 19.1.0, TypeScript ~5.9.2
- File-based routing via `expo-router` — entry point is `expo-router/entry`
- Firebase backend: Auth, Firestore, Storage, Analytics, Cloud Functions
- Google OAuth login (`@react-native-google-signin/google-signin`)
- i18n via `react-i18next` — translations in `locales/en.json` and `locales/es.json`
- Ads via `react-native-google-mobile-ads`

## Commands

| Action | Command |
|---|---|
| Install deps | `pnpm install` |
| Start dev server | `pnpm expo` (web at `localhost:4321`) |
| Lint | `pnpm lint` (runs `expo lint`) |
| Build production | `pnpm build` |
| Run Android | `pnpm android` |
| Run iOS | `pnpm ios` (macOS only) |
| Run web | `pnpm web` |

## E2E Tests (Detox)

E2E tests live in `tests/e2e/` — a **separate npm package** with its own `package.json`.

```bash
cd tests/e2e
npm install           # install test deps (not pnpm — uses npm)
npm run build:ios     # build iOS debug binary first
npm test              # run all tests
npm run test:ios      # iOS only
npm run test:android  # Android only
```

- Requires `detox-cli` globally: `npm install -g detox-cli`
- Target devices: iPhone 14 simulator, Pixel 4 API 30 emulator
- Tests expect specific `testID` props on components (see `tests/e2e/README.md` for full list)
- Tests mock Firebase, ads, network, clipboard — no real backend needed to run them

## Lint Rules

ESLint config (`eslint.config.js`):
- **No semicolons** — `"semi": ["error", "never"]`
- `react-hooks/exhaustive-deps` is off
- `import/no-named-as-default-member` is off

## Path Aliases

`tsconfig.json` defines `@/*` aliases:
- `@/components/*`, `@/constants/*`, `@/db/*`, `@/hooks/*`, `@/libs/*`, `@/services/*`, `@/interfaces/*`, `@/locales/*`, `@/functions/*`, `@/assets/*`

## Project Structure

```
app/              # Expo Router screens: _layout.tsx, (tabs)/, stop.tsx, ttt.tsx, settings.tsx
components/       # Reusable UI components
constants/        # Theme.ts, GoogleAuth.ts
db/               # Firebase config, Firestore queries (firebaseConfig.ts, Fire.ts, FetchVersion.ts)
hooks/            # useStorage (AsyncStorage wrapper)
libs/             # Utilities: formatTime, parseBoolean, randomId
locales/          # en.json, es.json
services/         # i18next setup
functions/        # Firebase Cloud Functions (Node 22, TypeScript)
tests/e2e/        # Detox E2E tests (separate npm package)
```

## Firebase Cloud Functions

- Source: `functions/` directory
- Engine: Node 22
- Deploy: `firebase deploy --only functions`
- Predeploy runs lint + build automatically (see `firebase.json`)
- Build: `cd functions && npm run build` (compiles TypeScript)

## Build & Deploy

- EAS Build configured in `eas.json` — profiles: `development`, `preview`, `production`
- Production builds auto-increment version
- `google-services.json` and `GoogleService-Info.plist` are committed (Firebase config for dev)
- Android: minSdkVersion 24, compileSdk 36, edge-to-edge enabled
- New Architecture enabled (`newArchEnabled: true`)

## Stop Game Scoring Rules

- Max 4 players. Points per round:
  - "Different words" → **100** each.
  - "Same words" players split 100: 1 player → 100, 2 → 50, 3 (in a 4-player game) → 35, 4 → 25, otherwise `Math.round(100 / sameCount)`; no same words ("stop") → everyone gets 100.
- All scoring math lives in `libs/scoring.ts` (`SCORE_DIFFERENT_WORDS`, `pointsForSameWords`, `computeStopRoundPoints`, `pointsForOffline`). It is shared by `db/Fire.ts` and `app/stop.tsx` — reuse it, never duplicate point math.
- Online scoring flow:
  - Each player writes their own choice to `scoring.<uid>` (boolean) via `Fire.submitChoice` using a dot-path `updateDoc`.
  - Any client may run `Fire.scoreRound` when all players have submitted — a Firestore `runTransaction` guarded by `scoredRound === round` (idempotent, safe to run from all clients). It computes every player's points with `computeStopRoundPoints`, accumulates onto `players[].points`, sets `scoredRound` to the current round, and resets `scoring: {}`.
  - Call `Fire.clearScoring` when a new round starts.
- Schema evolution: new `StopModel` fields must be **optional/nullable** (e.g. `scoring`, `scoredRound`) so existing Firestore docs don't break.
- Offline mode: choice buttons stay visible; award `pointsForOffline(sameWords)` into local `points` state.
- Online displayed points come from the authoritative `gameData.players[].points` (via uid lookup), never from local state.

## Gotchas

- The `functions/` directory uses **npm** (has `package-lock.json`), while the root uses **pnpm**. Don't mix them.
- `tests/e2e/` also uses **npm**, not pnpm.
- `react-hooks/exhaustive-deps` is intentionally disabled — don't re-enable it.
- Hardcoded user UID bypass for email verification at `app/_layout.tsx:131` — this is intentional for a specific admin account.
