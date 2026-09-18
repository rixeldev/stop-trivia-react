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

## Friends System

- Profile/docs live under `users/{uid}`:
  - `users/{uid}` — profile doc created/refreshed on app open via `Fire.ensureProfile` (name, photoURL, email). Used to resolve "add friend by ID".
  - `users/{uid}/friends/{friendUid}` — accepted friendship `{ name, photoURL, addedAt }`.
  - `users/{uid}/receivedRequests/{fromUid}` — incoming requests `{ fromName, fromPhotoURL, sentAt }`.
  - `users/{uid}/sentRequests/{toUid}` — outgoing requests `{ toName, toPhotoURL, sentAt }`.
- `db/Fire.ts` API: `ensureProfile`, `getFriendProfile`, `onFriends`/`onReceivedRequests`/`onSentRequests` (onSnapshot subscriptions), `sendFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`, `cancelFriendRequest`, `removeFriend`. The first two and accept/remove run in `runTransaction`s; decline/cancel are direct `deleteDoc`s.
- `hooks/useFriends(uid)` subscribes to all three subcollections and returns `{ friends, received, sent, friendsIds, receivedIds, sentIds, isFriend }` — shared by `app/friends.tsx` and `components/PlayerInfoSheet.tsx`.
- UX: tapping another player in a stop room opens `PlayerInfoSheet` (BottomSheetModal) with that player's info and a contextual friend action (Add / Accept / Cancel / Remove); `app/friends.tsx` (reachable from Settings) lists friends and requests and supports adding by user ID.
- All friend subcollection docs are keyed by Firebase UID; profile data from a game's `players[]` (id/name/photoURL) is embedded in requests so friend discovery from a room works even if the target has no `users/{uid}` doc yet.

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

- Max 4 players. **Per input** each of the 10 inputs is worth **100** points, so a single word counts once:
  - "Different word" (valid, unique for that input) → **100**.
  - "Same word" players split 100: 2 → 50, 3 (in a 4-player game) → 35, 4 → 25, otherwise `Math.round(100 / sameCount)`; a unique valid word → 100.
  - **Empty input** → 0 and it is never asked about during review.
  - **Disqualified** (invalid word rejected) → 0.
- All scoring math lives in `libs/scoring.ts` (`SCORE_DIFFERENT_WORDS`, `pointsForSameWords`, `computeStopRoundPoints`, `pointsForOffline`, `computeStopRoundPointsWithReviews`, `normalizeWord`, `INPUT_KEYS`, `REJECT_THRESHOLD`). It is shared by `db/Fire.ts`, `app/stop.tsx`, and `components/ReviewWizard.tsx` — reuse it, never duplicate point math.

### Scoring flows

- **Offline** (legacy flow):
  - Choice buttons appear after STOP; offline awards `pointsForOffline(sameWords)` into local `points` state.
- **Online (2–4 players)** (word-review flow):
  - Players cannot join once the round is in progress; review applies to every online game.
  - After STOP, each client flushes its grid via `Fire.updatePlayerInputs`, which also writes `inputsRound` (the round the words belong to). Review UI waits until every player's `inputsRound === round` so stale words are never reviewed (see `app/stop.tsx` `allHaveInputs`).
  - `components/ReviewWizard.tsx` walks **input by input** through the other players' non-empty words. For each word the reviewer answers **Same/Different** (compared against their own word; hidden when their own input is empty) and **Confirm/Reject**. Reject requires a confirmation step that pins the exact player, word, and input.
  - Each reviewer submits a full per-round review via `Fire.submitReview` → `reviews.<uid>` = `{ <targetUid>: { <inputKey>: { same, accepted } } }`.
  - Any client may run `Fire.scoreRoundWithReviews` when every player has a review — a `runTransaction` guarded by `reviewedRound === round`. It computes per input with `computeStopRoundPointsWithReviews` (see below), accumulates onto `players[].points`, sets `reviewedRound`, and resets `scoring: {}` and `reviews: {}`.
  - Call `Fire.clearReviews` when a new round starts (alongside `Fire.clearScoring`).
- `computeStopRoundPointsWithReviews` per input: empty word → 0 for that word; word **disqualified** (0) when **≥ 2 other players** reject it (`REJECT_THRESHOLD`) — except in a **2-player** game, where the sole opponent's single rejection disqualifies (`Math.max(1, Math.min(REJECT_THRESHOLD, players.length - 1))`). Surviving words are grouped — a pair is "same" if the normalized strings match **or** both players voted each other *Same* — and each group splits the input's 100 with `pointsForSameWords(groupSize, playerCount)`.
- Schema evolution: new `StopModel`/`StopPlayer` fields must be **optional/nullable** (e.g. `scoring`, `scoredRound`, `reviews`, `reviewedRound`, `inputsRound`) so existing Firestore docs don't break.
- Online displayed points come from the authoritative `gameData.players[].points` (via uid lookup), never from local state.

## Gotchas

- The `functions/` directory uses **npm** (has `package-lock.json`), while the root uses **pnpm**. Don't mix them.
- `tests/e2e/` also uses **npm**, not pnpm.
- `react-hooks/exhaustive-deps` is intentionally disabled — don't re-enable it.
- Hardcoded user UID bypass for email verification at `app/_layout.tsx:131` — this is intentional for a specific admin account.
