import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"

interface Props {
  title: string
  description: string
  modalVisible: boolean
  onRequestClose: () => void
  onAccept: () => void
  acceptLabel?: string
  danger?: boolean
}

export const CustomModal = ({
  title,
  description,
  modalVisible,
  onRequestClose,
  onAccept,
  acceptLabel,
  danger = false,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Modal
      animationType="fade"
      transparent
      visible={modalVisible}
      onRequestClose={onRequestClose}
    >
      <LinearGradient
        colors={Theme.gradients.overlay}
        style={styles.centeredView}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.modalView}>
          <View style={styles.accentBar} />

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onRequestClose}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
                styles.actionBtn,
              ]}
            >
              <Text style={[styles.actionText, { color: Theme.colors.red }]}>
                {t("cancel")}
              </Text>
            </Pressable>

            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [
                { opacity: pressed ? 0.75 : 1 },
                styles.acceptBtn,
              ]}
            >
              <LinearGradient
                colors={
                  danger ? Theme.gradients.danger : Theme.gradients.primary
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.acceptGradient}
              >
                <Text style={[styles.actionText, { color: Theme.colors.text }]}>
                  {acceptLabel ?? t("accept")}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalView: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.lg,
  },
  accentBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: Theme.spacing.l,
    backgroundColor: Theme.colors.primarySoft,
    ...Theme.shadows.glow,
  },
  title: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  description: {
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    fontSize: Theme.sizes.h5,
    lineHeight: 21,
    marginTop: Theme.spacing.s,
  },
  actions: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    alignSelf: "flex-end",
    marginTop: Theme.spacing.xl,
  },
  actionBtn: {
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.radii.m,
  },
  actionText: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  acceptBtn: {
    borderRadius: Theme.radii.m,
    overflow: "hidden",
  },
  acceptGradient: {
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
  },
})