import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ToastAndroid,
  Animated,
  Pressable,
} from "react-native"
import { Theme } from "@/constants/Theme"
import { VerifiedIcon } from "./ui/Icons"
import { useTranslation } from "react-i18next"
import { auth } from "@/db/firebaseConfig"
import { sendEmailVerification, signOut } from "@react-native-firebase/auth"
import { router } from "expo-router"

export const WaitingVerification = () => {
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [btnScale] = useState(new Animated.Value(1))

  const { t } = useTranslation()

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser
      if (user && !checking) {
        setChecking(true)

        await user.reload()

        if (user.emailVerified) {
          clearInterval(interval)
          ToastAndroid.showWithGravity(
            t("email_verified"),
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
          )
          router.replace("/")
        }

        setChecking(false)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()

  const handleResendEmail = async () => {
    if (!auth.currentUser) return
    if (loading) return

    setLoading(true)

    await sendEmailVerification(auth.currentUser).finally(() => {
      setLoading(false)
    })

    ToastAndroid.showWithGravity(
      t("verification_email_sent"),
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    )
  }

  const handleSignOut = () => {
    if (loading) return

    setLoading(true)

    if (auth) {
      signOut(auth).finally(() => setLoading(false))
    }
  }

  return (
    <View style={styles.container}>
      <VerifiedIcon color={Theme.colors.accent} size={132} />
      <Text style={styles.title}>{t("verify_your_email")}</Text>
      <Text style={styles.subtitle}>
        {t("verify_your_email_desc_1")}
        {"\n"}
        {t("verify_your_email_desc_2")}
      </Text>
      <ActivityIndicator
        size="large"
        color={Theme.colors.primary}
        style={styles.loader}
      />
      <Text style={styles.hint}>{t("waiting_verification")}</Text>
      <Animated.View
        style={{ transform: [{ scale: btnScale }], width: "100%" }}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleResendEmail}
          style={({ pressed }) => [
            styles.submit,
            pressed && { opacity: 0.9 },
            loading && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {loading ? (
            <ActivityIndicator
              color={Theme.colors.text}
              style={{ width: 32, height: 32 }}
            />
          ) : (
            <Text style={styles.submitText}>
              {t("resend_email_verification")}
            </Text>
          )}
        </Pressable>
      </Animated.View>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.signout,
          pressed && { opacity: 0.9 },
          loading && { opacity: 0.8 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
      >
        {loading ? (
          <ActivityIndicator color={Theme.colors.text} />
        ) : (
          <Text style={styles.submitText}>{t("sign_out")}</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: Theme.sizes.h1,
    fontFamily: Theme.fonts.onestBold,
    color: Theme.colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  hint: {
    fontSize: Theme.sizes.h5,
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
  },
  submit: {
    backgroundColor: Theme.colors.primary,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    color: Theme.colors.text,
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onestBold,
  },
  signout: {
    backgroundColor: Theme.colors.red,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
})
