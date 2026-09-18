import { useState } from "react"
import { Modal, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { signOut } from "@react-native-firebase/auth"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { RefreshIcon } from "@/components/ui/Icons"
import { Theme } from "@/constants/Theme"
import { auth } from "@/db/firebaseConfig"

interface Props {
  visible: boolean
}

export const ProfileSyncModal = ({ visible }: Props) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleGoToLogin = async () => {
    if (loading) return
    setLoading(true)
    try {
      await signOut(auth)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <RefreshIcon color={Theme.colors.primarySoft} size={64} />
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.tag}>{t("account_sync")}</Text>
          <Text style={styles.title}>{t("login_again_title")}</Text>
        </View>

        <Text style={styles.subtitle}>{t("login_again_desc")}</Text>

        <PrimaryButton
          block
          title={loading ? t("signing_out") : t("go_to_login")}
          onPress={handleGoToLogin}
          loading={loading}
          style={{ marginTop: Theme.spacing.m }}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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