import { Theme } from "@/constants/Theme"
import { StopPlayer } from "@/interfaces/Player"
import { StopGameInputs } from "@/interfaces/StopGameInputs"
import { useTranslation } from "react-i18next"
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ListIcon } from "./ui/Icons"

interface Props {
  player: StopPlayer | null
  modalVisible: boolean
  onRequestClose: () => void
}

const fieldKeys: { key: keyof StopGameInputs; label: string }[] = [
  { key: "name", label: "name" },
  { key: "lastName", label: "last_name" },
  { key: "country", label: "country" },
  { key: "color", label: "color" },
  { key: "animal", label: "animal" },
  { key: "artist", label: "artist" },
  { key: "food", label: "food" },
  { key: "fruit", label: "fruit" },
  { key: "object", label: "object" },
  { key: "profession", label: "profession" },
]

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
      collapsable={true}
    >
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback>
            <LinearGradient
              colors={Theme.gradients.overlay}
              style={styles.backdrop}
            >
              <View style={styles.sheet}>
                <View style={styles.handle} />

                <View style={styles.header}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: Theme.colors.primary2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ListIcon color={Theme.colors.primarySoft} size={24} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name}>{player?.name}</Text>
                    <Text style={styles.subtitle}>
                      {t("players")} · {t("fill_spaces")}
                    </Text>
                  </View>
                </View>

                <View style={styles.rows}>
                  {fieldKeys.map(({ key, label }) => (
                    <View key={key} style={styles.row}>
                      <Text style={styles.rowLabel}>{t(label)}</Text>
                      <Text
                        style={[
                          styles.rowValue,
                          !player?.inputs?.[key] && styles.rowEmpty,
                        ]}
                        numberOfLines={1}
                      >
                        {player?.inputs?.[key] || "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    padding: Theme.spacing.l,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.radii.xxl,
    borderTopRightRadius: Theme.radii.xxl,
    padding: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxxl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.darkGray,
    alignSelf: "center",
    marginBottom: Theme.spacing.l,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    marginBottom: Theme.spacing.l,
  },
  name: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  subtitle: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
  },
  rows: {
    gap: Theme.spacing.s,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Theme.spacing.m,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  rowLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  rowValue: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h5,
    flexShrink: 1,
  },
  rowEmpty: {
    color: Theme.colors.darkGray,
  },
})
