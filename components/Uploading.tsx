import { ProgressBar } from "@/components/ProgressBar"
import { Theme } from "@/constants/Theme"
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
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text
            style={{
              color: Theme.colors.gray,
              fontFamily: Theme.fonts.onestBold,
              fontSize: Theme.sizes.h3,
              alignSelf: "center",
              marginBottom: 16,
            }}
          >
            {t("uploading")}
          </Text>

          <View>
            {image && (
              <Image
                source={{ uri: image }}
                style={{
                  width: 100,
                  height: 100,
                  resizeMode: "contain",
                  borderRadius: 6,
                  alignSelf: "center",
                }}
              />
            )}
          </View>

          <View style={{ marginVertical: 12 }}>
            <ProgressBar progress={progress} />
          </View>

          {!uploading && (
            <View
              style={{ flexDirection: "row", gap: 12, alignSelf: "flex-end" }}
            >
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? Theme.colors.background2
                      : Theme.colors.transparent,
                  },
                  styles.modalBottomButtons,
                ]}
              >
                <Text
                  style={{
                    fontFamily: Theme.fonts.onest,
                    color: Theme.colors.red,
                  }}
                >
                  {t("cancel")}
                </Text>
              </Pressable>

              <Pressable
                onPress={onAccept}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? Theme.colors.background2
                      : Theme.colors.transparent,
                  },
                  styles.modalBottomButtons,
                ]}
              >
                <Text
                  style={{
                    fontFamily: Theme.fonts.onest,
                    color: Theme.colors.accent,
                  }}
                >
                  {t("accept")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  modalView: {
    margin: 20,
    backgroundColor: Theme.colors.modal,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalBottomButtons: {
    padding: 12,
    borderRadius: 16,
  },
})
