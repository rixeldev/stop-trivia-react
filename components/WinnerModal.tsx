import { useEffect, useMemo, useRef } from "react"
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { getAuth } from "@react-native-firebase/auth"
import { Theme } from "@/constants/Theme"
import { StopPlayer } from "@/interfaces/Player"
import { TrophyIcon, UserIcon } from "@/components/ui/Icons"
import { PrimaryButton } from "@/components/ui/PrimaryButton"

const CONFETTI_COLORS = [
  "#00C8C8",
  "#04A8A8",
  "#4CFF4C",
  "#FFD166",
  "#FF5555",
  "#D9F4F3",
  "#8C8CFF",
  "#FF9F43",
]

const CONFETTI_COUNT = 60

interface Props {
  winner: StopPlayer | null
  onClose: () => void
}

function ConfettiPiece({
  height,
  startDelay,
}: {
  height: number
  startDelay: number
}) {
  const progress = useRef(new Animated.Value(0)).current
  const color = useRef(
    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  ).current
  const left = useRef<`${number}%`>(`${Math.random() * 100}%`).current
  const size = useRef(6 + Math.random() * 7).current
  const duration = useRef(2600 + Math.random() * 2400).current
  const rotateEnd = useRef(`${360 + Math.random() * 720}deg`).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    )
    const timer = setTimeout(() => loop.start(), startDelay)
    return () => {
      clearTimeout(timer)
      loop.stop()
    }
  }, [progress, duration, startDelay])

  const translateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-40, height + 60],
      }),
    [progress, height],
  )
  const rotate = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", rotateEnd],
      }),
    [progress, rotateEnd],
  )
  const scale = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.3, 0.6],
      }),
    [progress],
  )
  const opacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0.75, 1],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [progress],
  )

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left,
        width: size,
        height: size * 0.65,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { rotate }, { scale }],
      }}
    />
  )
}

function ConfettiLayer({ height }: { height: number }) {
  const pieces = useRef(
    Array.from({ length: CONFETTI_COUNT }, (_, index) => index),
  ).current

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((index) => (
        <ConfettiPiece
          key={index}
          height={height}
          startDelay={Math.random() * 2600}
        />
      ))}
    </View>
  )
}

export const WinnerModal = ({ winner, onClose }: Props) => {
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

          <View style={styles.pointsChip}>
            <Text style={styles.pointsValue}>{winner.points ?? 0}</Text>
            <Text style={styles.pointsLabel}>{t("points")}</Text>
          </View>

          <PrimaryButton
            title={t("close")}
            onPress={onClose}
            block
            icon={<TrophyIcon size={18} color={Theme.colors.text} />}
          />
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
  pointsChip: {
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
  pointsValue: {
    color: Theme.colors.yellow,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h2,
    fontVariant: ["tabular-nums"],
  },
  pointsLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
})