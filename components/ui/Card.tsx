import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { ReactNode } from "react"
import { Pressable, StyleSheet, View, ViewStyle } from "react-native"

interface Props {
  children: ReactNode
  style?: ViewStyle | ViewStyle[]
  onPress?: () => void
  highlighted?: boolean
}

export function Card({ children, style, onPress, highlighted }: Props) {
  const gradient = highlighted ? Theme.gradients.cardHigh : Theme.gradients.card

  const content = (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.clip]}
    >
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          highlighted && styles.highlighted,
          pressed && styles.pressed,
          style as ViewStyle,
        ]}
      >
        {content}
      </Pressable>
    )
  }

  return (
    <View style={[styles.base, highlighted && styles.highlighted, style]}>
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.radii.xl,
    ...Theme.shadows.md,
  },
  clip: {
    borderRadius: Theme.radii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    overflow: "hidden",
    width: "100%",
    minHeight: "100%",
  },
  highlighted: {
    ...Theme.shadows.glow,
  },
  inner: {
    padding: Theme.spacing.l,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
})