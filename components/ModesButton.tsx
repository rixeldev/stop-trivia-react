import { Theme } from "@/constants/Theme"
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from "react-native"
import { ForwardIcon } from "@/components/ui/Icons"
import React, { ReactElement, useState } from "react"
import { LinearGradient } from "expo-linear-gradient"

const modeImages: Record<string, any> = {
  stopOffline: require("@/assets/stop/offline-card.jpg"),
  stopOnline: require("@/assets/stop/online-card.jpg"),
  tttOffline: require("@/assets/ttt/offline-card.webp"),
  tttComputer: require("@/assets/ttt/computer-card.webp"),
  tttOnline: require("@/assets/ttt/online-card.jpg"),
  tttJoin: require("@/assets/ttt/join-card.webp"),
}

interface Props {
  children?: React.ReactNode
  icon: ReactElement
  rightIcon?: ReactElement | undefined
  title: string
  subtitle?: string
  flag: string
  image?: keyof typeof modeImages
  onPress: (flag: string) => void
}

export const ModesButton = ({
  children,
  icon,
  rightIcon,
  title,
  subtitle,
  flag,
  image,
  onPress,
}: Props) => {
  const [btnScale] = useState(new Animated.Value(1))

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(flag)}
        style={({ pressed }) => [
          pressed && { opacity: 0.9 },
          styles.pressables,
        ]}
      >
        <LinearGradient
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "row",
          }}
          end={{ x: 1, y: 0 }}
          start={{ x: 0.2, y: 0 }}
          colors={[Theme.colors.modal, Theme.colors.primary2]}
        >
          {image && (
            <Image
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: -1,
                opacity: 0.5,
              }}
              source={modeImages[image]}
            />
          )}

          <View
            style={{
              width: "100%",
              height: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 38,
              gap: 18,
            }}
          >
            {icon}

            <View style={{ flex: 1, gap: subtitle ? 0 : 12 }}>
              <Text
                style={{
                  color: Theme.colors.text,
                  fontSize: Theme.sizes.h2,
                  fontFamily: Theme.fonts.onestBold,
                }}
              >
                {title}
              </Text>

              {subtitle && (
                <Text
                  style={{
                    color: Theme.colors.gray,
                    fontSize: Theme.sizes.h5,
                    fontFamily: Theme.fonts.onest,
                  }}
                >
                  {subtitle}
                </Text>
              )}

              {children}
            </View>

            {rightIcon ? (
              rightIcon
            ) : (
              <ForwardIcon size={32} color={Theme.colors.accent} />
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pressables: {
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    gap: 18,
  },
})
