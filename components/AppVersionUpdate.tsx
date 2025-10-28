import { Theme } from "@/constants/Theme"
import {
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { UpdateIcon } from "./ui/Icons"
import { useTranslation } from "react-i18next"
import { useState } from "react"

export const AppVersionUpdate = () => {
  const [btnScale] = useState(new Animated.Value(1))

  const { t } = useTranslation()

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()

  return (
    <View style={styles.container}>
      <UpdateIcon color={Theme.colors.accent} size={132} />
      <Text style={styles.title}>{t("update_game")}</Text>
      <Text style={styles.subtitle}>
        {t("update_game_desc_1")}
        {"\n"}
        {t("update_game_desc_2")}
      </Text>
      <Animated.View
        style={{ transform: [{ scale: btnScale }], width: "100%" }}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() =>
            Linking.openURL(
              "https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline"
            )
          }
          style={({ pressed }) => [styles.submit, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel=" Update"
        >
          <Text style={styles.submitText}>{t("update")}</Text>
        </Pressable>
      </Animated.View>
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
})
