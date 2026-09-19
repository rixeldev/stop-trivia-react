import "@/services/i18next"
import React, { useEffect, useState } from "react"
import { Image, Pressable, Text, ToastAndroid, View } from "react-native"
import { Link, Stack, useRouter } from "expo-router"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { StatusBar } from "expo-status-bar"
import { useFonts } from "expo-font"
import { CogIcon } from "@/components/ui/Icons"
import { Theme } from "@/constants/Theme"
import SplashScreen from "@/components/ui/SplashScreen"
import { auth } from "@/db/firebaseConfig"
import { LoginForm } from "@/components/LoginForm"
import { useTranslation } from "react-i18next"
import { useStorage } from "@/hooks/useStorage"
import * as RNLocalize from "react-native-localize"
import { WaitingVerification } from "@/components/WaitingVerification"
import { getVersion } from "react-native-device-info"
import { FetchVersion } from "@/db/FetchVersion"
import { AppVersionUpdate } from "@/components/AppVersionUpdate"
import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads"
import {
  FirebaseAuthTypes,
  onAuthStateChanged,
} from "@react-native-firebase/auth"
import { Onboarding } from "@/components/Onboarding"
import { parseBoolean } from "@/libs/parseBoolean"
import Fire from "@/db/Fire"
import { useFriends } from "@/hooks/useFriends"
import { ProfileSyncModal } from "@/components/ProfileSyncModal"
import { GameInviteModal } from "@/components/GameInviteModal"
import { GameInviteEntry } from "@/interfaces/Game"

export default function Layout() {
  const [isAppReady, setIsAppReady] = useState(false)
  const [isAppUpdated, setIsAppUpdated] = useState<boolean | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [firstTime, setFirstTime] = useState<boolean | null>(null)
  const [profileChecked, setProfileChecked] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [invites, setInvites] = useState<GameInviteEntry[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)

  const router = useRouter()

  const { received } = useFriends(user?.uid)

  const { i18n, t } = useTranslation()
  const { getItem, setItem } = useStorage()

  const handleAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    setUser(user)
    if (initializing) setInitializing(false)
  }

  useEffect(() => {
    if (!user?.uid) return
    setProfileChecked(false)
    const unsubscribe = Fire.onProfileSaved(user.uid, (saved) => {
      setProfileSaved(saved)
      setProfileChecked(true)
    })
    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = Fire.onGameInvites(user.uid, (entries) =>
      setInvites(entries),
    )
    return unsubscribe
  }, [user?.uid])

  useEffect(() => {
    setLoading(true)

    const loadSettings = async () => {
      const locales = RNLocalize.getLocales()
      const localeCode = locales?.[0]?.languageCode === "es" ? "es" : "en"
      const vibration = await getItem("vibration")
      const languageCode = await getItem("language")
      const firstTimeStorage = await getItem("first_time")

      if (firstTimeStorage === null) {
        setFirstTime(true)
      } else {
        setFirstTime(parseBoolean(firstTimeStorage) === false ? false : true)
      }

      if (!vibration) await setItem("vibration", String(true))
      i18n.changeLanguage(languageCode ?? localeCode)

      // Initialize Mobile Ads for child-directed treatment and under age of consent
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
      })

      await mobileAds().initialize()

      try {
        const currentVersion = getVersion()
        await FetchVersion().then((version) => {
          if (version?.version && currentVersion < version?.version) {
            setIsAppUpdated(false)
          } else {
            setIsAppUpdated(true)
          }

          setLoading(false)
        })
      } catch (error: any) {
        console.log("Error fetching version: ", error)
        setIsAppUpdated(true)
        setLoading(false)
      }
    }

    loadSettings()

    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged)
    return subscriber
  }, [])

  const [loaded] = useFonts({
    Onest: require("../assets/fonts/onest-latin-400-normal.ttf"),
    OnestBold: require("../assets/fonts/onest-latin-800-normal.ttf"),
  })

  const handleOnboardingOnDone = async () => {
    await setItem("first_time", "false")
    setFirstTime(false)
  }

  const handleInviteAccept = async () => {
    const invite = invites[0]
    if (!invite || !user) return
    setInviteLoading(true)
    try {
      const result = await Fire.acceptGameInvite(
        user.uid,
        user.displayName,
        user.photoURL,
        invite.gameId,
        invite.gameType ?? "stop",
      )
      if (result === "ok") {
        setInvites((prev) =>
          prev.filter((entry) => entry.gameId !== invite.gameId),
        )
        if (invite.gameType === "ttt") {
          router.push({
            pathname: "ttt",
            params: {
              mode: "join",
              id: invite.gameId,
            },
          })
        } else {
          router.push({
            pathname: "stop",
            params: {
              mode: "join",
              id: invite.gameId,
              time: invite.currentTime ? String(invite.currentTime) : "120",
              rounds: invite.maxRounds ? String(invite.maxRounds) : undefined,
            },
          })
        }
      } else {
        ToastAndroid.showWithGravity(
          result === "full"
            ? t("error_game_full")
            : result === "started"
              ? t("error_game_started")
              : result === "closed"
                ? t("host_closed_game")
                : t("error_game_not_found"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
      }
    } catch {
      /* ignore */
    } finally {
      setInviteLoading(false)
    }
  }

  const handleInviteDecline = async () => {
    const invite = invites[0]
    if (!invite || !user) return
    await Fire.declineGameInvite(user.uid, invite.gameId, invite.gameType ?? "stop")
    setInvites((prev) =>
      prev.filter((entry) => entry.gameId !== invite.gameId),
    )
  }

  if (!loaded || !isAppReady) {
    return (
      <SplashScreen
        onFinish={(isCancelled) => !isCancelled && setIsAppReady(true)}
      />
    )
  }

  if (user && !isAppUpdated && loaded && isAppReady && !loading) {
    return <AppVersionUpdate />
  }

  if (firstTime) {
    return <Onboarding onDone={handleOnboardingOnDone} />
  }

  return (
    <SafeAreaProvider
      style={{ height: "100%", backgroundColor: Theme.colors.background }}
    >
      <StatusBar style="auto" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        {user ? (
          !user?.emailVerified &&
          user?.uid !== "bd2qRZxUQSa0Rnxe9YhW4rB41bl1" ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <WaitingVerification />
            </View>
          ) : (
            <Stack
              screenOptions={{
                animationMatchesGesture: true,
                animation: "default",
                animationDuration: 100,
                contentStyle: { backgroundColor: Theme.colors.background },
                headerStyle: { backgroundColor: Theme.colors.background },
                headerShadowVisible: false,
                headerTintColor: Theme.colors.text,
                headerTitle: "Stop Trivia",
                headerTitleAlign: "center",
                headerTitleStyle: {
                  fontSize: Theme.sizes.h0,
                  fontFamily: Theme.fonts.onestBold,
                  color: Theme.colors.text,
                },
                headerLeft: () => (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: Theme.colors.surface,
                      borderWidth: 1,
                      borderColor: Theme.colors.borderSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      source={require("@/assets/icons/ic_brand.png")}
                      style={{ width: 28, height: 28 }}
                    />
                  </View>
                ),
                headerRight: () => (
                  <Link asChild href="/settings">
                    <Pressable
                      style={({ pressed }) => [
                        {
                          position: "relative",
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: Theme.colors.surface,
                          borderWidth: 1,
                          borderColor: Theme.colors.borderSoft,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <CogIcon
                        color={Theme.colors.primarySoft}
                        size={22}
                      />
                      {received.length > 0 && (
                        <View
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            top: -3,
                            right: -3,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            paddingHorizontal: 4,
                            backgroundColor: Theme.colors.red,
                            borderWidth: 1,
                            borderColor: Theme.colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: Theme.colors.text,
                              fontFamily: Theme.fonts.onestBold,
                              fontSize: 10,
                            }}
                          >
                            {received.length > 99
                              ? "99+"
                              : received.length}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </Link>
                ),
              }}
            />
          )
        ) : (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <LoginForm />
          </View>
        )}
      </GestureHandlerRootView>

      {profileChecked && user && !profileSaved && <ProfileSyncModal visible />}

      <GameInviteModal
        invite={invites[0] ?? null}
        onAccept={handleInviteAccept}
        onDecline={handleInviteDecline}
        loading={inviteLoading}
      />
    </SafeAreaProvider>
  )
}
