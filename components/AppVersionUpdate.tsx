import { Theme } from "@/constants/Theme"
import { Linking, StyleSheet, Text, View } from "react-native"
import { UpdateIcon } from "./ui/Icons"
import { useTranslation } from "react-i18next"
import { Screen } from "@/components/ui/Screen"
import { PrimaryButton } from "@/components/ui/PrimaryButton"

export const AppVersionUpdate = () => {
  const { t } = useTranslation()

  return (
    <Screen padding={0}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <UpdateIcon color={Theme.colors.primarySoft} size={64} />
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.tag}>{t("update")}</Text>
          <Text style={styles.title}>{t("update_game")}</Text>
        </View>

        <Text style={styles.subtitle}>
          {t("update_game_desc_1")}
          {"\n"}
          {t("update_game_desc_2")}
        </Text>

        <PrimaryButton
          block
          title={t("update")}
          onPress={() =>
            Linking.openURL(
              "https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline"
            )
          }
          style={{ marginTop: Theme.spacing.m }}
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
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.glow,
    marginBottom: Theme.spacing.s,
  },
  titleWrap: {
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  tag: {
    fontSize: Theme.sizes.h5,
    fontFamily: Theme.fonts.onestBold,
    color: Theme.colors.primarySoft,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  title: {
    fontSize: Theme.sizes.display,
    fontFamily: Theme.fonts.onestBold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Theme.spacing.l,
  },
})