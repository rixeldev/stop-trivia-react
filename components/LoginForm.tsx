// components/LoginForm.tsx
import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  AccessibilityInfo,
  Keyboard,
  ToastAndroid,
  Vibration,
  Linking,
  ScrollView,
} from "react-native"
import { GOOGLE_AUTH_WEB_CLIENT_ID } from "@/constants/GoogleAuth"
import { Theme } from "@/constants/Theme"
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "@/components/ui/Icons"
import ic from "@/assets/lotties/ic_brand.json"
import LottieView from "lottie-react-native"
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from "@react-native-firebase/auth"
import { auth } from "@/db/firebaseConfig"
import { useTranslation } from "react-i18next"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { Screen } from "@/components/ui/Screen"
import Fire from "@/db/Fire"

export const LoginForm = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [btnScale] = useState(new Animated.Value(1))
  const [signInForm, setSignInForm] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { t } = useTranslation()

  const googleSignin = async () => {
    setGoogleLoading(true)

    try {
      GoogleSignin.configure({
        offlineAccess: false,
        webClientId: GOOGLE_AUTH_WEB_CLIENT_ID,
        scopes: ["profile", "email"],
        forceCodeForRefreshToken: true,
      })

      try {
        await GoogleSignin.signOut()
        await GoogleSignin.revokeAccess()
      } catch (e) {
        console.log(e)
      }

      await GoogleSignin.hasPlayServices()

      const signInResult = await GoogleSignin.signIn()
      const idToken = signInResult.data?.idToken
      const googleCredentials = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(getAuth(), googleCredentials)

      const currentUser = getAuth().currentUser
      if (currentUser) await Fire.markProfileSaved(currentUser)
    } catch (error: any) {
      console.log(error)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    googleSignin()
  }

  const validate = () => {
    setError(null)

    if (email.trim() === "" || password.trim() === "") {
      Vibration.vibrate(100)
      return setError(t("error_login_credentials"))
    }

    if (!signInForm) {
      if (password !== repeatPassword && password.length >= 6) {
        Vibration.vibrate(100)
        return setError(t("error_login_passwords_equals"))
      }

      if (displayName.trim().length < 3) {
        Vibration.vibrate(100)
        return setError(t("error_login_username_min"))
      }

      if (displayName.trim().length > 10) {
        Vibration.vibrate(100)
        return setError(t("error_login_username_max"))
      }

      if (displayName.trim().includes(" ")) {
        Vibration.vibrate(100)
        return setError(t("error_login_username_spaces"))
      }

      if (displayName.trim() === "") {
        Vibration.vibrate(100)
        return setError(t("error_login_username_empty"))
      }
    }
    return null
  }

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()
  const handleChangeForm = async () => setSignInForm((prev) => !prev)

  const handleForgot = () => {
    if (!email && email === "") {
      setError(t("error_login_email_empty"))
      return
    }

    if (email || email !== "") {
      sendPasswordResetEmail(auth, email).then(() => {
        ToastAndroid.showWithGravity(
          t("email_sent"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
      })
      setError(null)
    }
  }

  const handleSignin = async () => {
    setLoading(true)
    setError(null)

    const err = validate()
    if (err) {
      console.log(err)
      setLoading(false)
      setError(err)
      AccessibilityInfo.announceForAccessibility(err)
      return
    }

    try {
      if (signInForm) {
        await signInWithEmailAndPassword(auth, email, password)
        if (auth.currentUser) await Fire.markProfileSaved(auth.currentUser)
      } else {
        if (password === repeatPassword) {
          await createUserWithEmailAndPassword(auth, email, password).then(
            (res) => {
              updateProfile(res.user, {
                displayName: displayName.trim(),
              })
              sendEmailVerification(res.user)
              Fire.markProfileSaved(res.user)
              ToastAndroid.showWithGravity(
                t("verification_email_sent"),
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
              )
            },
          )
          console.log("Signed up!")
        }
      }
    } catch (e: any) {
      let message: string = t("error_login_credentials")
      switch (e.code) {
        case "auth/email-already-in-use":
          Vibration.vibrate(100)
          message = t("error_login_email_used")
          break
        case "auth/user-not-found":
          Vibration.vibrate(100)
          message = t("error_login_email_not_found")
          break
        case "auth/wrong-password":
          Vibration.vibrate(100)
          message = t("error_login_password_incorrect")
          break
        case "auth/too-many-requests":
          Vibration.vibrate(100)
          message = t("error_login_many_attemps")
          break
        case "auth/invalid-email":
          Vibration.vibrate(100)
          message = t("error_login_email_invalid")
          break
        case "auth/weak-password":
          Vibration.vibrate(100)
          message = t("error_login_password_min")
          break
        case "auth/invalid-credential":
          Vibration.vibrate(100)
          message = t("error_login_email_password_invalid")
          break
      }

      setError(message)
      AccessibilityInfo.announceForAccessibility(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen padding={0}>
      {(googleLoading || loading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Theme.colors.primarySoft} />
        </View>
      )}

      <Pressable
        style={{ flex: 1, width: "100%", alignItems: "center" }}
        onPress={() => Keyboard.dismiss()}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.brandRow}>
              <LottieView
                source={ic}
                autoPlay
                loop={false}
                duration={3000}
                style={{
                  width: 42,
                  height: 42,
                }}
              />

              <Text style={styles.title}>top Trivia</Text>
            </View>

            {!signInForm && (
              <View style={styles.field}>
                <View style={styles.iconTile}>
                  <UserIcon size={18} color={Theme.colors.primarySoft} />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={t("username")}
                  placeholderTextColor={Theme.colors.darkGray}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoComplete="name-given"
                  value={displayName}
                  onChangeText={setDisplayName}
                  returnKeyType="next"
                  accessibilityLabel="Username"
                  importantForAutofill="yes"
                  cursorColor={Theme.colors.primarySoft}
                />
              </View>
            )}

            <View style={styles.field}>
              <View style={styles.iconTile}>
                <MailIcon size={18} color={Theme.colors.primarySoft} />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t("email")}
                placeholderTextColor={Theme.colors.darkGray}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                accessibilityLabel="Email"
                importantForAutofill="yes"
                cursorColor={Theme.colors.primarySoft}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.iconTile}>
                <LockIcon size={18} color={Theme.colors.primarySoft} />
              </View>

              <TextInput
                style={styles.input}
                placeholder={t("password")}
                placeholderTextColor={Theme.colors.darkGray}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignin}
                accessibilityLabel="Password"
                cursorColor={Theme.colors.primarySoft}
              />

              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                style={styles.iconRight}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOffIcon size={18} color={Theme.colors.gray} />
                ) : (
                  <EyeIcon size={18} color={Theme.colors.gray} />
                )}
              </Pressable>
            </View>

            {!signInForm && (
              <View style={styles.field}>
                <View style={styles.iconTile}>
                  <LockIcon size={18} color={Theme.colors.primarySoft} />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={t("repeat_password")}
                  placeholderTextColor={Theme.colors.darkGray}
                  secureTextEntry={!showPassword}
                  value={repeatPassword}
                  onChangeText={setRepeatPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSignin}
                  accessibilityLabel="Password"
                  cursorColor={Theme.colors.primarySoft}
                />

                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.iconRight}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} color={Theme.colors.gray} />
                  ) : (
                    <EyeIcon size={18} color={Theme.colors.gray} />
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.row}>
              <Text style={styles.error}>{error}</Text>

              {signInForm && (
                <Pressable onPress={handleForgot} hitSlop={8}>
                  <Text style={styles.forgotText}>{t("forgot")}</Text>
                </Pressable>
              )}
            </View>

            <Animated.View
              style={{ transform: [{ scale: btnScale }], width: "100%" }}
            >
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSignin}
                style={({ pressed }) => [
                  styles.submit,
                  pressed && { opacity: 0.92 },
                  loading && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                {loading ? (
                  <ActivityIndicator color={Theme.colors.text} />
                ) : (
                  <Text style={styles.submitText}>
                    {signInForm ? t("sign_in") : t("sign_up")}
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {signInForm ? t("sign_up_question") : t("sign_in_question")}
              </Text>

              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                onPress={handleChangeForm}
                hitSlop={8}
              >
                <Text style={styles.signupText}>
                  {signInForm ? t("sign_up") : t("sign_in")}
                </Text>
              </Pressable>
            </View>

            <View>
              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>{t("or_sign_in_with")}</Text>
                <View style={styles.line} />
              </View>

              <Pressable
                onPress={handleGoogleSignIn}
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && { opacity: 0.9 },
                  loading && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.googleText, { color: "#4285F4" }]}>G</Text>
                <Text style={[styles.googleText, { color: "#DB4437" }]}>o</Text>
                <Text style={[styles.googleText, { color: "#F4B400" }]}>o</Text>
                <Text style={[styles.googleText, { color: "#4285F4" }]}>g</Text>
                <Text style={[styles.googleText, { color: "#0F9D58" }]}>l</Text>
                <Text style={[styles.googleText, { color: "#DB4437" }]}>e</Text>
              </Pressable>

              {!signInForm && <View style={{ height: 12 }} />}
            </View>

            <Pressable
              onPress={() => Linking.openURL("https://rixel.dev/privacy")}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.footerPolicy}>{t("privacy_policy")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.background,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.backdrop,
    zIndex: 50,
  },
  container: {
    padding: Theme.spacing.l,
    flex: 1,
    width: "100%",
    minWidth: 300,
    alignSelf: "center",
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.xxl,
    gap: Theme.spacing.s,
  },
  brandChip: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.l,
    ...Theme.shadows.md,
  },
  title: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.display,
    color: Theme.colors.text,
    marginStart: -5,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: 4,
    marginBottom: Theme.spacing.m,
    ...Theme.shadows.sm,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: Theme.radii.s,
    backgroundColor: Theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.s,
  },
  iconRight: {
    marginLeft: Theme.spacing.s,
    padding: Theme.spacing.s,
  },
  input: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
    paddingVertical: Theme.spacing.m,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.m,
    minHeight: 18,
  },
  forgotText: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  error: {
    color: Theme.colors.red,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  submit: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radii.pill,
    alignItems: "center",
    marginTop: Theme.spacing.s,
    marginBottom: Theme.spacing.m,
    flexDirection: "row",
    justifyContent: "center",
    gap: Theme.spacing.s,
    ...Theme.shadows.glow,
  },
  submitText: {
    color: Theme.colors.text,
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onestBold,
    letterSpacing: 0.4,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.s,
    marginVertical: Theme.spacing.l,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
  },
  orText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Theme.spacing.s,
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.xl,
  },
  footerText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  footerPolicy: {
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textAlign: "center",
    marginVertical: Theme.spacing.m,
    textDecorationLine: "underline",
  },
  signupText: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h5,
  },
  googleBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.m,
    borderRadius: Theme.radii.pill,
  },
  googleText: {
    fontSize: Theme.sizes.h2,
    fontFamily: Theme.fonts.onestBold,
  },
})
