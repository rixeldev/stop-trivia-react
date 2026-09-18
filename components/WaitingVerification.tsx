import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ToastAndroid,
} from "react-native"
import { Theme } from "@/constants/Theme"
import { LogoutIcon, VerifiedIcon } from "./ui/Icons"
import { useTranslation } from "react-i18next"
import { auth } from "@/db/firebaseConfig"
import { sendEmailVerification, signOut } from "@react-native-firebase/auth"
import { router } from "expo-router"
import { Screen } from "@/components/ui/Screen"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"

export const WaitingVerification = () => {
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)

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
    <Screen padding={0}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <VerifiedIcon color={Theme.colors.primarySoft} size={72} />
        </View>

        <Text style={styles.title}>{t("verify_your_email")}</Text>
        <Text style={styles.subtitle}>
          {t("verify_your_email_desc_1")}
          {"\n"}
          {t("verify_your_email_desc_2")}
        </Text>

        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={Theme.colors.primarySoft} />
          <Text style={styles.hint}>{t("waiting_verification")}</Text>
        </View>

        <PrimaryButton
          block
          title={t("resend_email_verification")}
          onPress={handleResendEmail}
          loading={loading}
        />

        <SecondaryButton
          block
          danger
          title={t("sign_out")}
          onPress={handleSignOut}
          icon={<LogoutIcon size={18} color={Theme.colors.red} />}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.xxl,
    gap: Theme.spacing.l,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.glow,
    marginBottom: Theme.spacing.m,
  },
  title: {
    fontSize: Theme.sizes.display,
    fontFamily: Theme.fonts.onestBold,
    color: Theme.colors.text,
    textAlign: "center",
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Theme.spacing.l,
  },
  loaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.s,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.l,
    marginBottom: Theme.spacing.m,
  },
  hint: {
    fontSize: Theme.sizes.h5,
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
  },
})