export default {
  expo: {
    name: "Stop Trivia Online",
    slug: "stop-trivia",
    version: "2.3.3",
    orientation: "portrait",
    icon: "./assets/icons/mipmap-xxxhdpi/ic_launcher.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "stoptrivia",
    splash: {
      image: "./assets/icons/mipmap-xxxhdpi/ic_launcher.png",
      resizeMode: "contain",
      backgroundColor: "#000B0A",
    },
    platforms: ["android", "ios", "web"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rilisentertainment.stoptriviaonline",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/mipmap-xxxhdpi/ic_launcher.png",
        backgroundColor: "#000B0A",
      },
      icon: "./assets/icons/mipmap-xxxhdpi/ic_launcher.png",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.rilisentertainment.stoptriviaonline",
      googleServicesFile: "./google-services.json",
      versionCode: 12,
      version: "2.4.4",
      minSdkVersion: 24,
      ndkVersion: "29.0.14206865",
      softwareKeyboardLayoutMode: "pan",
    },
    web: {
      favicon: "./assets/icons/ic_brand.png",
    },
    plugins: [
      "@react-native-firebase/app",
      "expo-router",
      "expo-font",
      "@react-native-google-signin/google-signin",
      [
        "expo-image-picker",
        {
          photosPermission:
            "The game accesses your photos to let you pick an image for your profile picture.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/icons/mipmap-xxxhdpi/ic_launcher.png",
          backgroundColor: "#000B0A",
          dark: {
            image: "./assets/icons/mipmap-xxxhdpi/ic_launcher.png",
            backgroundColor: "#000B0A",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
          android: {
            targetSdkVersion: 36,
            compileSdk: 36,
            compileSdkVersion: 36,
            ndkVersion: "29.0.14206865",
          },
        },
      ],
      [
        "react-native-google-mobile-ads",
        {
          android_app_id: "ca-app-pub-5333671658707378~9974389837",
          androidAppId: "ca-app-pub-5333671658707378~9974389837",
          ios_app_id: "ca-app-pub-5333671658707378~7006565543",
          iosAppId: "ca-app-pub-5333671658707378~7006565543",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "efcde181-f82b-437a-910b-94b2e117ac25",
      },
    },
  },
}
