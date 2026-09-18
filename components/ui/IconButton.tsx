import { Theme } from "@/constants/Theme"
import { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native"

interface Props {
  icon: ReactNode
  onPress?: () => void
  label?: string
  color?: string
  size?: number
  highlighted?: boolean
  style?: ViewStyle
}

export function IconButton({
  icon,
  onPress,
  label,
  color = Theme.colors.secondary,
  size = 56,
  highlighted = false,
  style,
}: Props) {
  const content = (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: highlighted
            ? Theme.colors.primarySoft
            : Theme.colors.surface,
          borderColor: highlighted ? "transparent" : Theme.colors.borderSoft,
        },
        highlighted && styles.glow,
        style,
      ]}
    >
      {icon}
    </View>
  )

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {label && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  glow: {
    ...Theme.shadows.glow,
  },
  label: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    marginTop: Theme.spacing.xs,
  },
})