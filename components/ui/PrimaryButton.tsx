import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { ReactNode, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native"

interface Props {
  title: string
  onPress: () => void
  icon?: ReactNode
  size?: "md" | "lg"
  block?: boolean
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  size = "md",
  block = false,
  loading = false,
  disabled = false,
  style,
}: Props) {
  const [scale] = useState(new Animated.Value(1))
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        block && styles.block,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.base, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={
            disabled
              ? [Theme.colors.surfaceHigh, Theme.colors.surface]
              : Theme.gradients.primary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.text} />
          ) : (
            <>
              {icon}
              <Text style={styles.text}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.radii.lg,
    overflow: "hidden",
    ...Theme.shadows.glow,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
  },
  text: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  block: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.92,
  },
})