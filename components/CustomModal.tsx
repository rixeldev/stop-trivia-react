import { Theme } from "@/constants/Theme"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"

interface Props {
  title: string
  description: string
  modalVisible: boolean
  onRequestClose: () => void
  onAccept: () => void
}

export const CustomModal = ({
  title,
  description,
  modalVisible,
  onRequestClose,
  onAccept,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={modalVisible}
      onRequestClose={onRequestClose}
      backdropColor={Theme.colors.backdrop}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View>
            <Text
              style={{
                color: Theme.colors.accent,
                fontFamily: Theme.fonts.onestBold,
                fontSize: Theme.sizes.h3,
              }}
            >
              {title}
            </Text>
          </View>

          <View style={{ marginVertical: 12 }}>
            <Text
              style={{
                fontFamily: Theme.fonts.onest,
                color: Theme.colors.gray,
              }}
            >
              {description}
            </Text>
          </View>

          <View
            style={{ flexDirection: "row", gap: 12, alignSelf: "flex-end" }}
          >
            <Pressable
              onPress={onRequestClose}
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
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  columns: {
    flex: 1,
    flexDirection: "column",
    gap: 18,
  },
  buttons: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: "flex-start",
  },
  texts: {
    color: Theme.colors.lightGray,
    alignSelf: "flex-start",
    fontFamily: Theme.fonts.onestBold,
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
  },
  modalBottomButtons: {
    padding: 12,
    borderRadius: 16,
  },
})
