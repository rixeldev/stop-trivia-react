import { Theme } from "@/constants/Theme"
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
  block?: boolean
  danger?: boolean
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function SecondaryButton({
  title,
  onPress,
  icon,
  block = false,
  danger = false,
  loading = false,
  disabled = false,
  style,
}: Props) {
  const [scale] = useState(new Animated.Value(1))
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()

  const color = danger ? Theme.colors.red : Theme.colors.secondary

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
        style={({ pressed }) => [
          styles.base,
          { borderColor: danger ? Theme.colors.red : Theme.colors.borderSoft },
          pressed && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={color} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, { color }]}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
  },
  text: {
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
    opacity: 0.85,
  },
})
