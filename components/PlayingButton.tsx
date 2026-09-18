import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { ReactNode, useState } from "react"
import { Animated, Pressable, StyleSheet } from "react-native"

interface Props {
  icon: ReactNode
  onPress: (flag: string) => void
  flag: string
}

export const PlayingButton = ({ icon, onPress, flag }: Props) => {
  const [scale] = useState(new Animated.Value(1))
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()

  const isStop = flag === "stop"
  const shadow = isStop ? Theme.shadows.glowDanger : Theme.shadows.glow

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, shadow, styles.wrapper]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(flag)}
        style={({ pressed }) => [styles.base, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={
            isStop
              ? Theme.gradients.danger
              : flag === "restart"
                ? Theme.gradients.cardHigh
                : Theme.gradients.primary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {icon}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
  },
  base: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
})