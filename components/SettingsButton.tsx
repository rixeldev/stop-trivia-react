import { ReactElement } from "react"
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ViewStyle,
} from "react-native"
import { ForwardIcon } from "@/components/ui/Icons"
import { Theme } from "@/constants/Theme"

interface SettingsButtonProps {
  onPress: () => void
  title: string
  description?: string
  icon: ReactElement
  color?: string
  style?: ViewStyle | ViewStyle[]
}

export const SettingsButton = ({
  onPress,
  title,
  description,
  icon,
  color,
  style,
}: SettingsButtonProps) => {
  return (
    <Pressable
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1, backgroundColor: pressed ? Theme.colors.surfaceHigh : Theme.colors.transparent },
        styles.pressable,
        style,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconTile, { borderColor: Theme.colors.borderSoft }]}>
        {icon}
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, color && { color }]} numberOfLines={1}>
          {title}
        </Text>
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      <ForwardIcon size={18} color={Theme.colors.darkGray} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.s,
    alignItems: "center",
    borderRadius: Theme.radii.lg,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Theme.radii.m,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  description: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    marginTop: 1,
    lineHeight: 15,
  },
})