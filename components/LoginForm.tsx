// components/LoginForm.tsx
import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  AccessibilityInfo,
  Keyboard,
  ToastAndroid,
  Vibration,
  Linking,
  Platform,
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
    try {
      setGoogleLoading(true)
      GoogleSignin.configure({
        offlineAccess: false,
        webClientId: GOOGLE_AUTH_WEB_CLIENT_ID,
        scopes: ["profile", "email"],
      })
      await GoogleSignin.hasPlayServices()
      const signInResult = await GoogleSignin.signIn()
      const idToken = signInResult.data?.idToken
      const googleCredentials = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(getAuth(), googleCredentials)
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

      if (displayName.trim().length > 20) {
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
          ToastAndroid.CENTER
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
        console.log("Signed in!")
      } else {
        if (password === repeatPassword) {
          await createUserWithEmailAndPassword(auth, email, password).then(
            (res) => {
              updateProfile(res.user, {
                displayName: displayName.trim(),
              })
              sendEmailVerification(res.user)
              ToastAndroid.showWithGravity(
                t("verification_email_sent"),
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
              )
            }
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.wrapper}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      {googleLoading ||
        (loading && (
          <View
            style={{
              flex: 1,
              backgroundColor: Theme.colors.backdrop,
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
            }}
          >
            <ActivityIndicator
              size="large"
              color={Theme.colors.accent}
              style={{ width: 38, height: 38, alignSelf: "center" }}
            />
          </View>
        ))}

      <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
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
              <View style={styles.iconLeft}>
                <UserIcon color={Theme.colors.gray} />
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
                cursorColor={Theme.colors.accent}
              />
            </View>
          )}

          <View style={styles.field}>
            <View style={styles.iconLeft}>
              <MailIcon color={Theme.colors.gray} />
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
              cursorColor={Theme.colors.accent}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.iconLeft}>
              <LockIcon color={Theme.colors.gray} />
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
              cursorColor={Theme.colors.accent}
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
                <EyeOffIcon color={Theme.colors.gray} />
              ) : (
                <EyeIcon color={Theme.colors.gray} />
              )}
            </Pressable>
          </View>

          {!signInForm && (
            <View style={styles.field}>
              <View style={styles.iconLeft}>
                <LockIcon color={Theme.colors.gray} />
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
                cursorColor={Theme.colors.accent}
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
                  <EyeOffIcon color={Theme.colors.gray} />
                ) : (
                  <EyeIcon color={Theme.colors.gray} />
                )}
              </Pressable>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.error}>{error}</Text>

            {signInForm && (
              <Pressable onPress={handleForgot}>
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
                pressed && { opacity: 0.9 },
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
            >
              <Text style={styles.signupText}>
                {signInForm ? t("sign_up") : t("sign_in")}
              </Text>
            </Pressable>
          </View>

          <View>
            <Text
              style={{
                textAlign: "center",
                color: Theme.colors.gray,
                marginVertical: 24,
              }}
            >
              {t("or_sign_in_with")}
            </Text>

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
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 4,
              alignSelf: "stretch",
            }}
          >
            <Text
              onPress={() => Linking.openURL("https://rikirilis.com/privacy")}
              style={styles.footerPolicy}
            >
              {t("privacy_policy")}
            </Text>
          </View>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
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
  container: {
    padding: 12,
    flex: 1,
    width: "auto",
    maxWidth: 350,
    justifyContent: "center",
  },
  title: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: 42,
    color: Theme.colors.text,
    marginStart: -5,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
    padding: 6,
  },
  input: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  forgotText: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.onest,
  },
  error: {
    color: Theme.colors.red,
    marginBottom: 8,
    fontFamily: Theme.fonts.onest,
  },
  submit: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
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
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.background ?? Theme.colors.darkGray,
  },
  orText: {
    marginHorizontal: 8,
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onest,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
  },
  socialBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Theme.colors.background2,
    alignItems: "center",
    marginHorizontal: 4,
  },
  socialText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onest,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 4,
  },
  footerText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
  },
  footerPolicy: {
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onest,
    marginVertical: 8,
  },
  signupText: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.onestBold,
  },
  googleBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.primary2,
    backgroundColor: Theme.colors.modal,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  googleText: {
    fontSize: Theme.sizes.h2,
    fontFamily: Theme.fonts.onestBold,
  },
})
