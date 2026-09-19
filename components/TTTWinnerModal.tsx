import { Image, Modal, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { getAuth } from "@react-native-firebase/auth"
import { Theme } from "@/constants/Theme"
import { TTTPlayer } from "@/interfaces/Player"
import { TrophyIcon, UserIcon } from "@/components/ui/Icons"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { ConfettiLayer } from "@/components/Confetti"

interface Props {
  winner: TTTPlayer | null
  onClose: () => void
  onPlayAgain: () => void
}

export const TTTWinnerModal = ({ winner, onClose, onPlayAgain }: Props) => {
  const { t } = useTranslation()
  const { height } = useWindowDimensions()

  if (!winner) return null

  const isMe = winner.id === getAuth().currentUser?.uid

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <LinearGradient
        colors={Theme.gradients.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.overlay}
      >
        <ConfettiLayer height={height} />
        <View style={styles.card}>
          <LinearGradient
            colors={Theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trophyBadge}
          >
            <TrophyIcon size={34} color={Theme.colors.text} />
          </LinearGradient>

          <Text style={styles.tag}>{t("winner")}</Text>

          <View style={styles.avatarRing}>
            {winner.photoURL ? (
              <Image source={{ uri: winner.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <UserIcon size={44} color={Theme.colors.primarySoft} />
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {winner.name || (isMe ? t("you") : "-")}
          </Text>
          <Text style={styles.caption}>
            {isMe ? t("you_win") : t("player_wins", { name: winner.name })}
          </Text>

          <View style={styles.winsChip}>
            <Text style={styles.winsValue}>{winner.wins ?? 0}</Text>
            <Text style={styles.winsLabel}>{t("wins")}</Text>
          </View>

          <PrimaryButton
            title={t("play_again")}
            onPress={onPlayAgain}
            block
            icon={<TrophyIcon size={18} color={Theme.colors.text} />}
          />
          <SecondaryButton title={t("close")} onPress={onClose} block />
        </View>
      </LinearGradient>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "86%",
    maxWidth: 360,
    alignItems: "center",
    padding: Theme.spacing.xxl,
    borderRadius: Theme.radii.xxl,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.primarySoft,
    ...Theme.shadows.lg,
  },
  trophyBadge: {
    width: 72,
    height: 72,
    borderRadius: Theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.glow,
  },
  tag: {
    color: Theme.colors.yellow,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: Theme.spacing.m,
  },
  avatarRing: {
    marginTop: Theme.spacing.m,
    marginBottom: Theme.spacing.s,
    padding: 3,
    borderRadius: Theme.radii.pill,
    backgroundColor: Theme.colors.primary,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Theme.radii.pill,
  },
  avatarFallback: {
    backgroundColor: Theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h2,
    textAlign: "center",
  },
  caption: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.m,
  },
  winsChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Theme.spacing.s,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.radii.pill,
    backgroundColor: Theme.colors.primary2,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    marginBottom: Theme.spacing.xl,
  },
  winsValue: {
    color: Theme.colors.yellow,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h2,
    fontVariant: ["tabular-nums"],
  },
  winsLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
})