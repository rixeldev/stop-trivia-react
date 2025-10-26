# → RikiRilis' Web | Blog | Portfolio ←

<a href="https://github.com/RikiRilis/stop-trivia-react">
  <img src="https://rikirilis.com/images/stop-trivia.webp" />
</a>

[Dowmload it →](https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline)

## 📃 Description →

This repository have the Stop Trivia Online's game code, [React Native](https://reactnative.dev/) with [Expo](https://expo.dev), [Firebase](https://firebase.google.com), and upload to the [Google Play Store](https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline).


This game was primarily built in Kotlin. However, for performance and development platform reasons, it moved to [React Native](https://reactnative.dev/) with [Expo](https://expo.dev).

## 🤝 You can use this repository by following the next steps →

### 🚀 Getting Started

Follow these steps to set up and run the Stop Trivia Online project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/RikiRilis/stop-trivia-react.git
   ```

2. **Navigate into the project folder**
   ```bash
   cd stop-trivia-react
   ```

3. **Install dependencies using pnpm**
   ```bash
   pnpm install
   ```

4. **Start the project**
   ```bash
   pnpm expo
   ```

5. **Access the app**
   - For web, visit: [http://localhost:4321](http://localhost:4321)
   - You can run the project on Android, iOS, or directly in your browser, depending on your Expo/React Native environment.

### 🛠️ Project Structure

- `/components` - React Native UI components (e.g., `AppVersionUpdate.tsx`)
- `/constants` - Static configuration (themes, Google Auth credentials)
- `/hooks` - Custom React hooks (e.g., `useStorage`)
- `/assets` - Images and static assets
- `/app` - App screens/pages and layouts
- `/navigation` - Navigation configuration
- `/services` - API and service integrations (e.g., Firebase)
- `/locales` - Translations and localization files
- `/tests/e2e` - Comprehensive end-to-end test suite using Detox

### ⚙️ Main Features

- **Cross-platform:** Built with React Native + Expo, runs on Android, iOS, and web.
- **Authentication:** Supports Google OAuth login for web, iOS, and Android (see `constants/GoogleAuth.ts` for client IDs).
- **Persistent Storage:** Uses AsyncStorage for saving user data (`hooks/useStorage.tsx`).
- **Custom Themes:** Easily configurable color/font schemes (`constants/Theme.ts`).
- **App Update Notification:** In-app notification for new versions (`components/AppVersionUpdate.tsx`).
- **Multi-lingual:** i18n support with translation files in `/locales`.
- **Comprehensive E2E Testing:** Full end-to-end test suite using Detox covering all app features and game modes.

### 🧪 Testing

This project includes a comprehensive end-to-end test suite located in `/tests/e2e/`:

- **Full App Coverage:** Tests cover authentication, navigation, both game modes (Stop Trivia and Tic Tac Toe), settings, and error handling
- **Cross-Platform:** Tests run on both iOS and Android simulators/emulators
- **Real User Scenarios:** Tests simulate real user interactions including game play, input validation, and edge cases
- **Performance Testing:** Includes load time validation and rapid interaction testing
- **CI/CD Ready:** Designed for continuous integration pipelines

**Running E2E Tests:**
```bash
cd tests/e2e
npm install
npm run build:ios    # For iOS
npm run build:android # For Android
npm test             # Run all tests
```

See `/tests/e2e/README.md` for detailed testing documentation and setup instructions.

### 💡 Notes

- You must have [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/), and [Expo CLI](https://docs.expo.dev/get-started/installation/) installed.
- For Google login to work, set up your project in [Firebase Console](https://console.firebase.google.com/) and use the provided OAuth client IDs.
- For iOS simulator or device testing, a macOS setup with Xcode is required.
- For E2E testing, you'll need Detox CLI and appropriate simulators/emulators set up.

### 🌟 Contributing

Contributions are welcome! If you find bugs or want to add features, feel free to open an issue or submit a pull request.

### 📲 Download

The app is available on [Google Play Store](https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline).

## 🧞 All commands you can use for the project →

All commands are run from the root of the project, from a terminal:

| Command                         | Action                                                           |
| :------------------------------ | :----------------------------------------------------------------|
| `pnpm install`                  | Installs all dependencies                                        |
| `pnpm expo`                     | Starts the Expo development server                               |
| `pnpm android`                  | Runs the app on an Android emulator/device via Expo              |
| `pnpm ios`                      | Runs the app on an iOS simulator/device via Expo (macOS only)    |
| `pnpm web`                      | Runs the app in your web browser                                 |
| `pnpm lint`                     | Lints project files                                              |
| `pnpm test`                     | Runs unit tests (if configured)                                  |
| `pnpm build`                    | Builds the production bundle                                     |
| `pnpm start`                    | Alias for `pnpm expo`                                            |
| `cd tests/e2e && npm test`      | Runs comprehensive E2E tests                                     |
| `cd tests/e2e && npm run test:ios` | Runs E2E tests on iOS simulator                               |
| `cd tests/e2e && npm run test:android` | Runs E2E tests on Android emulator                        |