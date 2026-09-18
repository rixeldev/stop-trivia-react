import LottieView from "lottie-react-native"
import ic from "@/assets/lotties/ic_brand.json"
import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { Animated, Easing, StyleSheet, Text } from "react-native"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

export default function SplashScreen({
  onFinish = (isCancelled) => {},
}: {
  onFinish: (isCancelled: boolean) => void
}) {
  const fade = useRef(new Animated.Value(0)).current
  const translate = useRef(new Animated.Value(12)).current
  const { t } = useTranslation()

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start()
  }, [fade, translate])

  return (
    <LinearGradient
      colors={Theme.gradients.background}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[
          styles.center,
          { opacity: fade, transform: [{ translateY: translate }] },
        ]}
      >
        <LottieView
          onAnimationFinish={onFinish}
          source={ic}
          autoPlay
          loop={false}
          duration={3000}
          style={styles.lottie}
        />

        <Text style={styles.title}>
          Stop <Text style={styles.titleAccent}>Trivia</Text>
        </Text>

        <Text style={styles.tagline}>{t("splashscreen.tagline")}</Text>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: Theme.spacing.m,
  },
  title: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.hero,
    color: Theme.colors.text,
    width: "100%",
    textAlign: "center",
  },
  titleAccent: {
    color: Theme.colors.primarySoft,
  },
  tagline: {
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    color: Theme.colors.gray,
    letterSpacing: 0.4,
    textAlign: "center",
  },
})
