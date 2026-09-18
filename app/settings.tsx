import pkg from "../app.config.js"
import {
  BackIcon,
  CopyIcon,
  LanguageIcon,
  ListIcon,
  LogoutIcon,
  PrivacyIcon,
  UserIcon,
  VibrationIcon,
  WebIcon,
  EditIcon,
  GithubIcon,
  ShareIcon,
  QuestionIcon,
  StarIcon,
  ForwardIcon,
  UsersIcon,
} from "@/components/ui/Icons"
import { Theme } from "@/constants/Theme"
import { Stack, useNavigation, router } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  ToastAndroid,
  Vibration,
  View,
  Share,
} from "react-native"
import { useStorage } from "@/hooks/useStorage"
import { parseBoolean } from "@/libs/parseBoolean"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import BottomSheet from "@gorhom/bottom-sheet"
import Clipboard from "@react-native-clipboard/clipboard"
import { signOut, updateProfile } from "@react-native-firebase/auth"
import { auth, storage } from "@/db/firebaseConfig"
import { useTranslation } from "react-i18next"
import { Updaloading } from "@/components/Uploading"
import * as ImagePicker from "expo-image-picker"
import * as RNLocalize from "react-native-localize"
import NetInfo from "@react-native-community/netinfo"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "@react-native-firebase/storage"
import { Screen } from "@/components/ui/Screen"
import { LinearGradient } from "expo-linear-gradient"

const languageCodes = ["en", "es"]
const appVersion = pkg.expo.android.version

export default function Settings() {
  const locales = RNLocalize.getLocales()
  const localeCode = locales?.[0]?.languageCode === "es" ? "es" : "en"

  const [isVibrationEnabled, setIsVibrationEnabled] = useState(false)
  const [languageSelected, setLanguageSelected] = useState<string>(localeCode)
  const [image, setImage] = useState("")
  const [progress, setProgress] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [connection, setConnection] = useState(true)
  const [userName, setUserName] = useState<string | null | undefined>(
    "Anon-12345678",
  )
  const [userId, setUserId] = useState<string | undefined>(
    "1234567890101112131415",
  )
  const [userEmail, setUserEmail] = useState<string | undefined>(
    "email@email.com",
  )

  const { t, i18n } = useTranslation()
  const { setItem, getItem } = useStorage()

  const languageLabel = languageSelected === "es" ? t("es") : t("en")

  const sheetRef = useRef<BottomSheet>(null)
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const loadSettings = async () => {
      const vibrationValue = await getItem("vibration")
      const languageCode = await getItem("language")

      setIsVibrationEnabled(parseBoolean(vibrationValue))
      setLanguageSelected(languageCode ?? localeCode)
      setUserId(auth.currentUser?.uid)
      setUserEmail(auth.currentUser?.email ?? "email@email.com")
      setUserName(auth.currentUser?.displayName)
    }

    const unsubscription = NetInfo.addEventListener((state) => {
      setConnection(state.isConnected ?? false)
    })

    loadSettings()

    return unsubscription()
  }, [])

  const toggleVibrationSwitch = () => {
    setIsVibrationEnabled((prev) => {
      const newValue = !prev
      setItem("vibration", String(newValue))
      if (newValue) Vibration.vibrate(10)
      return newValue
    })
  }

  const toggleLanguage = (code: string) => {
    setLanguageSelected(code)
    setItem("language", code)
    sheetRef.current?.close()
    i18n.changeLanguage(code)
  }

  const copyUserId = () => {
    isVibrationEnabled && Vibration.vibrate(10)
    Clipboard.setString(userId ?? "")
    ToastAndroid.showWithGravity(
      t("copied_clipboard"),
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    )
  }

  const handleSignOut = () => {
    if (auth) {
      signOut(auth)
    }
  }

  const handlePickImage = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync()

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 2],
      quality: 0.5,
      allowsMultipleSelection: false,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setModalVisible(true)
    }
  }

  const uploadImage = async (uri: string) => {
    if (!connection) {
      ToastAndroid.showWithGravity(
        t("you_are_offline"),
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      )
      return
    }
    if (!auth.currentUser) return
    if (uploading) return

    setUploading(true)

    const response = await fetch(uri)
    const blob = await response.blob()
    const storageRef = ref(storage, `Profiles/${auth.currentUser.uid}`)
    const uploadTask = uploadBytesResumable(storageRef, blob)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setProgress(+progress.toFixed())
      },
      (error) => {
        console.log("Upliad failed:", error)
        setImage("")
        setModalVisible(false)
        ToastAndroid.showWithGravity(
          t("error_uploading"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
      },
      () => {
        getDownloadURL(uploadTask.snapshot!.ref).then(async (downloadURL) => {
          await updateProfile(auth.currentUser!, { photoURL: downloadURL })
          setImage(downloadURL)
          setModalVisible(false)
          setProgress(0)
          setUploading(false)
        })
      },
    )
  }

  const handleAccept = async (uri: string) => {
    await uploadImage(uri)
  }

  const handleClose = () => {
    setModalVisible(false)
    setImage("")
    setProgress(0)
    setUploading(false)
  }

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: `${t("sharing_text")} https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline`,
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error: any) {
      console.log("Error sharing:", error.message)
    }
  }

  return (
    <Screen padding={0}>
      <Stack.Screen
        options={{
          headerTintColor: Theme.colors.text,
          headerTitle: t("settings"),
          headerTitleStyle: {
            fontSize: Theme.sizes.h0,
            fontFamily: Theme.fonts.onestBold,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.headerBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <BackIcon size={22} color={Theme.colors.primarySoft} />
            </Pressable>
          ),
          headerRight: () => null,
        }}
      />

      <Updaloading
        onAccept={() => handleAccept(image)}
        onClose={handleClose}
        modalVisible={modalVisible}
        image={image}
        progress={progress}
        uploading={uploading}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={Theme.gradients.cardHigh}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={Theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <Pressable onPress={handlePickImage} style={styles.avatar}>
                  {auth.currentUser?.photoURL ? (
                    <Image
                      style={styles.avatarImage}
                      source={{ uri: auth.currentUser?.photoURL }}
                    />
                  ) : (
                    <UserIcon size={52} color={Theme.colors.primarySoft} />
                  )}
                </Pressable>
              </LinearGradient>

              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [
                  styles.editBadge,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <EditIcon size={14} color={Theme.colors.text} />
              </Pressable>
            </View>

            <Text style={styles.name}>{userName ?? "Stop Test"}</Text>
            <Text style={styles.email}>{userEmail}</Text>

            <Pressable
              onPress={copyUserId}
              style={({ pressed }) => [
                styles.userIdRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.userId} numberOfLines={1}>
                {userId}
              </Text>
              <CopyIcon size={14} color={Theme.colors.darkGray} />
            </Pressable>
          </View>
        </LinearGradient>

        <Text style={styles.sectionLabel}>
          {t("preferences", { defaultValue: "Preferences" })}
        </Text>

        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={toggleVibrationSwitch}
          >
            <View style={styles.iconTile}>
              <VibrationIcon size={20} color={Theme.colors.primarySoft} />
            </View>

            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t("vibration")}</Text>
              <Text style={styles.rowDescription}>{t("vibration_desc")}</Text>
            </View>

            <Switch
              trackColor={{
                false: Theme.colors.borderSoft,
                true: Theme.colors.primary2,
              }}
              thumbColor={
                isVibrationEnabled
                  ? Theme.colors.primarySoft
                  : Theme.colors.lightGray
              }
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleVibrationSwitch}
              value={isVibrationEnabled}
            />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => sheetRef.current?.expand()}
          >
            <View style={styles.iconTile}>
              <LanguageIcon size={20} color={Theme.colors.primarySoft} />
            </View>

            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t("language")}</Text>
              <Text style={styles.rowDescription}>{languageLabel}</Text>
            </View>

            <View style={styles.valuePill}>
              <Text style={styles.valuePillText}>
                {languageSelected.toUpperCase()}
              </Text>
              <ForwardIcon size={14} color={Theme.colors.darkGray} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>
          {t("community", { defaultValue: "Community" })}
        </Text>

        <View style={styles.group}>
          <Row
            onPress={() => router.push("/friends")}
            title={t("friends")}
            description={t("friends_desc")}
            icon={<UsersIcon size={20} color={Theme.colors.primarySoft} />}
          />

          <View style={styles.divider} />

          <Row
            onPress={handleShareApp}
            title={t("invite_friends")}
            description={t("invite_friends_desc")}
            icon={<ShareIcon size={20} color={Theme.colors.primarySoft} />}
          />

          <View style={styles.divider} />

          <Row
            onPress={() =>
              Linking.openURL(
                "https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline",
              )
            }
            title={t("rate_game")}
            description={t("rate_game_desc")}
            icon={<StarIcon size={20} color={Theme.colors.primarySoft} />}
          />

          <View style={styles.divider} />

          <Row
            onPress={() => Linking.openURL("https://rixel.dev")}
            title={t("site")}
            description={t("site_desc")}
            icon={<WebIcon size={20} color={Theme.colors.primarySoft} />}
          />
        </View>

        <Text style={styles.sectionLabel}>
          {t("about", { defaultValue: "About" })}
        </Text>

        <View style={styles.group}>
          <Row
            onPress={() => Linking.openURL("https://rixel.dev/privacy")}
            title={t("privacy_policy")}
            icon={<PrivacyIcon size={20} color={Theme.colors.primarySoft} />}
          />

          <View style={styles.divider} />

          <Row
            onPress={() => Linking.openURL("https://rixel.dev/terms")}
            title={t("terms_conditions")}
            icon={<ListIcon size={20} color={Theme.colors.primarySoft} />}
          />

          <View style={styles.divider} />

          <Row
            onPress={() =>
              Linking.openURL("https://github.com/rixel/stop-trivia-react")
            }
            title="Github"
            icon={<GithubIcon size={20} color={Theme.colors.primarySoft} />}
          />

          <View style={styles.divider} />

          <Row
            onPress={() => Linking.openURL("https://rixel.dev/#contact")}
            title="Feedback"
            icon={<QuestionIcon size={20} color={Theme.colors.primarySoft} />}
          />
        </View>

        {auth && (
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOut,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={Theme.gradients.danger}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signOutGradient}
            >
              <LogoutIcon size={20} color={Theme.colors.text} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </Pressable>
        )}

        <View style={[styles.footer, { marginBottom: insets.bottom + 16 }]}>
          <View style={styles.footerLine} />
          <Text style={styles.footerTitle}>Stop Trivia</Text>
          <Text style={styles.footerVersion}>{appVersion}</Text>
        </View>
      </ScrollView>

      <BottomSheetModal
        title={t("language")}
        ref={sheetRef}
        icon={<LanguageIcon size={20} color={Theme.colors.primarySoft} />}
      >
        <View style={styles.optionsWrap}>
          {languageCodes.map((option) => {
            const isSelected = languageSelected === option
            return (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 },
                  styles.optionContainer,
                ]}
                onPress={() => toggleLanguage(option)}
              >
                <View
                  style={[
                    styles.outerCircle,
                    {
                      borderColor: isSelected
                        ? Theme.colors.primarySoft
                        : Theme.colors.gray,
                      backgroundColor: isSelected
                        ? Theme.colors.primary2
                        : Theme.colors.transparent,
                    },
                  ]}
                >
                  {isSelected && <View style={styles.innerDot} />}
                </View>

                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionText}>
                    {option === "es" ? "Spanish" : "English"}
                  </Text>
                  <Text style={styles.optionSubText}>
                    {option === "es" ? "Español" : "Inglés"}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </BottomSheetModal>
    </Screen>
  )
}

const Row = ({
  onPress,
  title,
  description,
  icon,
}: {
  onPress: () => void
  title: string
  description?: string
  icon: React.ReactNode
}) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.iconTile}>{icon}</View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description && (
          <Text style={styles.rowDescription} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      <View style={styles.valuePill}>
        <ForwardIcon size={16} color={Theme.colors.darkGray} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: Theme.spacing.l,
    paddingTop: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  profileCard: {
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.glow,
  },
  profileHeader: {
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: Theme.spacing.s,
  },
  avatarRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    padding: 4,
    ...Theme.shadows.glow,
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceHigh,
    borderRadius: 54,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: Theme.colors.surface,
    ...Theme.shadows.sm,
  },
  name: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h0,
    textAlign: "center",
  },
  email: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
  },
  userIdRow: {
    flexDirection: "row",
    gap: Theme.spacing.s,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: Theme.spacing.s,
    marginTop: Theme.spacing.xs,
    maxWidth: "100%",
  },
  userId: {
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    maxWidth: 220,
  },
  sectionLabel: {
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: Theme.spacing.s,
    marginBottom: -Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.s,
  },
  group: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.xl,
    overflow: "hidden",
    ...Theme.shadows.md,
  },
  row: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    alignItems: "center",
    padding: Theme.spacing.m,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  rowDescription: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    lineHeight: 15,
  },
  valuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.s,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.xs,
  },
  valuePillText: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
    marginLeft: 64,
    opacity: 0.6,
  },
  signOut: {
    borderRadius: Theme.radii.lg,
    overflow: "hidden",
    ...Theme.shadows.glowDanger,
  },
  signOutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
    paddingVertical: Theme.spacing.l,
  },
  signOutText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.s,
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
    marginBottom: Theme.spacing.s,
  },
  footerTitle: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  footerVersion: {
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
  },
  optionsWrap: {
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: Theme.spacing.s,
    gap: Theme.spacing.xs,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.m,
    gap: Theme.spacing.m,
    borderRadius: Theme.radii.lg,
  },
  outerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primarySoft,
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionText: {
    fontSize: Theme.sizes.h4,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
  },
  optionSubText: {
    fontSize: Theme.sizes.h6,
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
  },
})
