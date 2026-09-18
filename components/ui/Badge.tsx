import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { ReactNode } from "react"
import { StyleSheet, Text } from "react-native"

interface Props {
  children: ReactNode
  variant?: "accent" | "danger" | "neutral"
}

export function Badge({ children, variant = "accent" }: Props) {
  const colors =
    variant === "danger"
      ? Theme.gradients.danger
      : variant === "neutral"
        ? [Theme.colors.surfaceHigh, Theme.colors.surface] as const
        : Theme.gradients.accent

  const textColor = variant === "neutral" ? Theme.colors.lightGray : "#FFFFFF"

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}
    >
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radii.pill,
    ...Theme.shadows.sm,
  },
  text: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
})