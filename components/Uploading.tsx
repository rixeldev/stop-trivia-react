import { ProgressBar } from "@/components/ProgressBar"
import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { View, StyleSheet, Image, Modal, Text, Pressable } from "react-native"

interface Props {
  modalVisible: boolean
  image: any
  progress: number
  onClose: () => void
  onAccept: () => void
  uploading: boolean
}

export const Updaloading = ({
  image,
  progress,
  onClose,
  onAccept,
  modalVisible,
  uploading,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Modal
      animationType="fade"
      transparent
      visible={modalVisible}
      onRequestClose={() => {}}
    >
      <LinearGradient
        colors={Theme.gradients.overlay}
        style={styles.centeredView}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.modalView}>
          <Text style={styles.title}>{t("uploading")}</Text>

          {image && (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: image }}
                style={styles.preview}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} />
          </View>

          {!uploading && (
            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
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
                  colors={Theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.acceptGradient}
                >
                  <Text style={[styles.actionText, { color: Theme.colors.text }]}>
                    {t("accept")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
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
    maxWidth: 360,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    ...Theme.shadows.lg,
  },
  title: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
    marginBottom: Theme.spacing.l,
  },
  previewWrap: {
    borderRadius: Theme.radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.sm,
  },
  preview: {
    width: 120,
    height: 120,
  },
  progressWrap: {
    marginVertical: Theme.spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    alignSelf: "flex-end",
    width: "100%",
    justifyContent: "flex-end",
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