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
import { Badge } from "@/components/ui/Badge"
import React, { ReactElement, useEffect, useRef, useState } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"

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
  isNew?: boolean
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
  isNew,
}: Props) => {
  const [btnScale] = useState(new Animated.Value(1))
  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()
  const scaleAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(1)).current

  const { t } = useTranslation()

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.75,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start()
  }, [scaleAnim, opacityAnim])

  return (
    <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
      {isNew && (
        <Animated.View
          style={{
            position: "absolute",
            zIndex: 1,
            right: Theme.spacing.m,
            top: -Theme.spacing.s,
            transform: [{ rotateZ: "10deg" }, { scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <Badge>{t("new")}</Badge>
        </Animated.View>
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(flag)}
        style={({ pressed }) => [pressed && styles.pressed, styles.pressable]}
      >
        <LinearGradient
          style={styles.card}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          colors={Theme.gradients.card}
        >
          {image && (
            <Image
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              source={modeImages[image]}
            />
          )}

          {image && (
            <LinearGradient
              style={StyleSheet.absoluteFill}
              colors={[
                "rgba(2,20,18,0.55)",
                "rgba(1,19,16,0.96)",
                "rgba(2,23,20,0.98)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          <View style={styles.content}>
            <View style={styles.iconTile}>{icon}</View>

            <View style={[styles.textWrap, { gap: subtitle ? 0 : 10 }]}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>

              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              )}

              {children}
            </View>

            {rightIcon ? (
              <View style={styles.iconTile}>{rightIcon}</View>
            ) : (
              <View
                style={[
                  styles.arrowTile,
                  { backgroundColor: Theme.colors.primary2 },
                ]}
              >
                <ForwardIcon size={22} color={Theme.colors.yellow} />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Theme.radii.xxl,
    ...Theme.shadows.md,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.94,
  },
  card: {
    borderRadius: Theme.radii.xxl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: Theme.spacing.xl,
    gap: Theme.spacing.l,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: Theme.radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  arrowTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.sizes.h2,
    fontFamily: Theme.fonts.onestBold,
  },
  subtitle: {
    color: Theme.colors.gray,
    fontSize: Theme.sizes.h5,
    fontFamily: Theme.fonts.onest,
    marginTop: 2,
    lineHeight: 19,
  },
})
