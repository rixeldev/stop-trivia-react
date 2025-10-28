import { Theme } from "@/constants/Theme"
import { Player } from "@/interfaces/Player"
import { useTranslation } from "react-i18next"
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native"

interface Props {
  player: Player | null
  modalVisible: boolean
  onRequestClose: () => void
}

export const PlayerInputsInfoModal = ({
  player,
  modalVisible,
  onRequestClose,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Modal
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={onRequestClose}
    >
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback>
            <View style={styles.modalView}>
              <Text
                style={{
                  color: Theme.colors.accent,
                  fontFamily: Theme.fonts.onestBold,
                  fontSize: Theme.sizes.h3,
                  alignSelf: "center",
                  marginBottom: 16,
                }}
              >
                {player?.name}
              </Text>

              <View
                style={{
                  gap: 8,
                  flexDirection: "column",
                }}
              >
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("name")}: {player?.inputs?.name}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("last_name")}: {player?.inputs?.lastName}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("country")}: {player?.inputs?.country}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("color")}: {player?.inputs?.color}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("animal")}: {player?.inputs?.animal}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("artist")}: {player?.inputs?.artist}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("food")}: {player?.inputs?.food}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("fruit")}: {player?.inputs?.fruit}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("object")}: {player?.inputs?.object}
                </Text>
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontFamily: Theme.fonts.onest,
                    backgroundColor: Theme.colors.background2,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {t("profession")}: {player?.inputs?.profession}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  columns: {
    flex: 1,
    flexDirection: "column",
    gap: 18,
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
    minWidth: 256,
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
