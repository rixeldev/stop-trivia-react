import React, { useEffect } from "react"
import { StyleSheet } from "react-native"
import { OnlineIcon, OfflineIcon } from "@/components/ui/Icons"
import { PlatformPressable } from "@react-navigation/elements"
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { Theme } from "@/constants/Theme"

interface Props {
  onPress: () => void
  onLongPress: () => void
  isFocused: boolean
  routeName: string
  label: string
  color: string
}

export const TabBarButton = ({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  color,
}: Props) => {
  const icon = {
    index: (props: any) => <OnlineIcon {...props} />,
    offline: (props: any) => <OfflineIcon {...props} />,
  }

  const scale = useSharedValue(0)

  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
      { duration: 200 }
    )
  }, [scale, isFocused])

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0])
    return { opacity }
  })

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2])
    const top = interpolate(scale.value, [0, 1], [0, 9])
    return { transform: [{ scale: scaleValue }], top: top }
  })

  return (
    <PlatformPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabbarItem}
    >
      <Animated.View style={animatedIconStyle}>
        {icon[routeName as keyof typeof icon]({
          color: color,
        })}
      </Animated.View>
      <Animated.Text
        style={[
          {
            color: color,
            textAlign: "center",
            fontSize: Theme.sizes.h6,
            fontFamily: Theme.fonts.onest,
          },
          animatedTextStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </PlatformPressable>
  )
}

const styles = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
})
