import { useEffect, useMemo, useRef } from "react"
import { Animated, StyleSheet, View } from "react-native"

export const CONFETTI_COLORS = [
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

export function ConfettiLayer({ height }: { height: number }) {
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