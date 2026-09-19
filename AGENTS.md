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
components/       # Reusable UI components: BottomSheetModal, PlayerInfoSheet, GameInviteModal, WinnerModal, TTTWinnerModal, Confetti, ReviewWizard, Onboarding, ...
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
  - `users/{uid}` — profile doc created **only** by the login flows (`Fire.markProfileSaved`) on Google/email sign-in or sign-up (name, photoURL, email, `registered: true`). Its existence in `users` is what marks the user as saved; add-by-ID resolution reads it.
  - `users/{uid}/friends/{friendUid}` — accepted friendship `{ name, photoURL, addedAt }`.
  - `users/{uid}/receivedRequests/{fromUid}` — incoming requests `{ fromName, fromPhotoURL, sentAt }`.
  - `users/{uid}/sentRequests/{toUid}` — outgoing requests `{ toName, toPhotoURL, sentAt }`.
- `db/Fire.ts` API: `markProfileSaved`, `onProfileSaved`, `getFriendProfile`, `onFriends`/`onReceivedRequests`/`onSentRequests` (onSnapshot subscriptions), `sendFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`, `cancelFriendRequest`, `removeFriend`. `markProfileSaved` and accept/remove run in `runTransaction`s; decline/cancel are direct `deleteDoc`s.
- **Reauth gate**: `app/_layout.tsx` subscribes to `onProfileSaved` (checks the `users/{uid}` doc exists). When a logged-in user has **no doc in `users`**, a non-dismissable `ProfileSyncModal` (full-screen, `onRequestClose` no-op) appears. Its button signs the user out, dropping them on the login page; logging in again calls `markProfileSaved` (doc now exists) and the modal never returns. The modal is only rendered inside the app shell, so the "update required" screen (`AppVersionUpdate`) always takes precedence.
- `hooks/useFriends(uid)` subscribes to all three subcollections and returns `{ friends, received, sent, friendsIds, receivedIds, sentIds, isFriend }` — shared by `app/friends.tsx` and `components/PlayerInfoSheet.tsx`.
- UX: tapping another player in a **stop or ttt** room opens `PlayerInfoSheet` (BottomSheetModal) with that player's info and a contextual friend action (Add / Accept / Cancel / Remove); `app/friends.tsx` (reachable from Settings) lists friends and requests and supports adding by user ID.
- `components/PlayerInfoSheet.tsx`: `player` is `StopPlayer | TTTPlayer | null` plus optional `statValue`/`statLabel` (overrides the default points stat). `app/stop.tsx` passes nothing (points), `app/ttt.tsx` passes wins.
- All friend subcollection docs are keyed by Firebase UID; profile data from a game's `players[]` (id/name/photoURL) is embedded in requests so friend discovery from a room works even if the target has no `users/{uid}` doc yet.

## Game Invites (Online Rooms)

- Invites go from the **room host** to an existing **friend**: send = write a subcollection doc `users/{toUid}/gameInvites/{gameId}`; also mirror the status on the game doc at `{gameId}.invites.{toUid}` = `{ name, photoURL, status }` (`"pending" | "declined" | "joined"`) so the host's sheet live-updates. `room/code`, `time`, and descriptions come from `GameInviteEntry` fields.
- `db/Fire.ts` invite API is **game-agnostic** — `sendGameInvite`/`acceptGameInvite`/`declineGameInvite` take a trailing `gameType: "stop" | "ttt"` and enforce a per-game player cap (`ttt` = 2, `stop` = 4). `acceptGameInvite` appends the joining player with the game's own shape (TTT gains `pos` = opposite of the host's `pos` and `wins: 0`; Stop gains `points: 0`). Decline sets `"declined"` so the host's Invite button re-enables.
- Invite docs must carry `gameType` for routing; `onGameInvites` falls back to `"stop"` for legacy docs. New `TTTModel.invites` / `GameInviteEntry.gameType` fields are optional/nullable.
- `app/_layout.tsx` subscribes globally via `onGameInvites(uid, ...)`. `handleInviteAccept` navigates to `ttt` (`{ mode: "join", id }`) when `invite.gameType === "ttt"`, otherwise to `stop` (with `time`/`rounds`); `handleInviteDecline` passes the gameType too. Accept/decline errors toast `error_game_full` / `error_game_started` / `error_game_closed` / `error_game_not_found`.
- `components/GameInviteModal.tsx`: invitee pop-up; the description key switches on `gameType` (`game_invite_desc` vs `game_invite_desc_ttt`).
- Host UI: an invite section lives inside the **players sheet** in both `app/stop.tsx` (4-cap) and `app/ttt.tsx` (2-cap) — host-only, rendered while the room is `CREATED` (shows "X/4" / "X/2", "This room is full" at cap, "no friends" hint otherwise), with per-friend Invite/Invited/Joined pill buttons driven by `gameData.invites` and a `busy`/`inviteWorkingId` spinner during the write.

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

## Tic Tac Toe Online (ttt.tsx)

- Modes: `offline`, `computer`, `online` (host creates a room), `join` (enters via room code or an invite). Online rooms are full at **2 players**; players cannot join once a match is underway.
- `gameStatus` stays `CREATED` during regular play — moves only update `filledPos`/`currentWinner`/`currentPlayer`, **not** the status. It flips to `STOPPED` only when a round is won (online). Consequences: screens that gate on `IN_PROGRESS` don't apply here, and `isHostLobby` (host + `CREATED`) stays true *during* a match, so the invite section naturally shows "This room is full".
- Winner handling (per-client effect on `board`):
  - The winning line resolves to a `pos` (row/col/diag index). Always pass it explicitly to `sumWins(winnerPos)` — reading the `winner` state inside the effect is stale (its closure is always null), which used to make wins never increment.
  - Picks `winnerPlayer` for the modal by matching `gameData.players[].pos` to the winning pos, with a by-uid fallback (legacy manual code-joins had no `pos`; the join flow now sets `pos` = opposite of the host's `pos`).
  - In online modes the win is persisted via `Fire.updateGame` (status `STOPPED`); offline/computer set local state only.
- `components/TTTWinnerModal.tsx`: confetti winner screen (shares `components/Confetti.tsx` with Stop's `WinnerModal`), winner trophy/avatar/name, wins chip, **Play again** (`handleRematch` → `handleReset`, stays in the room) and **Close** (dismiss-only). Losers see the same modal via `player_wins`. A **draw** shows only the inline "Draw!" text — no modal. Winners never auto-leave the room.
- `handleReset`: resets to `CREATED`, `round + 1`, random `currentPlayer`, empty board — everyone stays in the room and can keep playing. The restart button is shown for `online` and `join` (not just host) once there's a result.
- `useFriends(isHostLobby ? myUid : null)` — the friends list is fetched only while hosting an open lobby (for the invite section).
- Players sheet: rows sorted by wins descending; tapping an opponent row opens `PlayerInfoSheet` with `statValue = wins` / `statLabel = t("wins")`.

## Gotchas

- The `functions/` directory uses **npm** (has `package-lock.json`), while the root uses **pnpm**. Don't mix them.
- `tests/e2e/` also uses **npm**, not pnpm.
- `react-hooks/exhaustive-deps` is intentionally disabled — don't re-enable it.
- Hardcoded user UID bypass for email verification at `app/_layout.tsx:131` — this is intentional for a specific admin account.
- `react-native-app-intro-slider`'s default pagination internally uses RN's **deprecated** `SafeAreaView` (triggers the dev "SafeAreaView has been deprecated" warning). `components/Onboarding.tsx` must keep its custom `renderPagination` (plain `View`/`Pressable` wiring via `sliderRef`); the library's `_renderPagination()` remains as dead code in the bundle but is never invoked. Verify with `npx expo export:embed --platform android --dev true --entry-file node_modules/expo-router/entry.js --bundle-output <file> --assets-dest <dir>`.
