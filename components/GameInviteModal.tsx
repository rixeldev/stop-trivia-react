import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { Image, Modal, StyleSheet, Text, View } from "react-native"
import { GameInviteEntry } from "@/interfaces/Game"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { UserIcon } from "@/components/ui/Icons"

interface Props {
  invite: GameInviteEntry | null
  onAccept: () => void
  onDecline: () => void
  loading?: boolean
}

export const GameInviteModal = ({
  invite,
  onAccept,
  onDecline,
  loading = false,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Modal
      animationType="fade"
      transparent
      visible={invite !== null}
      onRequestClose={onDecline}
    >
      <LinearGradient
        colors={Theme.gradients.overlay}
        style={styles.centeredView}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.modalView}>
          <View style={styles.accentBar} />

          <Text style={styles.title}>{t("game_invite_title")}</Text>

          <LinearGradient
            colors={Theme.gradients.cardHigh}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hostCard}
          >
            <View style={styles.avatar}>
              {invite?.hostPhotoURL ? (
                <Image
                  style={styles.avatarImage}
                  source={{ uri: invite.hostPhotoURL }}
                />
              ) : (
                <UserIcon size={28} color={Theme.colors.primarySoft} />
              )}
            </View>

            <View style={styles.hostText}>
              <Text style={styles.hostName} numberOfLines={2}>
                {invite?.hostName ?? "Unknown"}
              </Text>
              <Text style={styles.hostCode} numberOfLines={1}>
                {t("code")}: {invite?.gameId.toUpperCase()}
              </Text>
            </View>
          </LinearGradient>

          <Text style={styles.description}>
            {t("game_invite_desc", { name: invite?.hostName ?? "" })}
          </Text>

          <View style={styles.actions}>
            <SecondaryButton
              title={t("decline_request")}
              onPress={onDecline}
              danger
              block
              disabled={loading}
            />
            <PrimaryButton
              title={t("game_invite_accept")}
              onPress={onAccept}
              block
              loading={loading}
            />
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
    marginBottom: Theme.spacing.l,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    padding: Theme.spacing.m,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  hostText: {
    flex: 1,
    gap: 2,
  },
  hostName: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  hostCode: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
  },
  description: {
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    fontSize: Theme.sizes.h5,
    lineHeight: 21,
    marginTop: Theme.spacing.l,
  },
  actions: {
    gap: Theme.spacing.s,
    marginTop: Theme.spacing.xl,
  },
})