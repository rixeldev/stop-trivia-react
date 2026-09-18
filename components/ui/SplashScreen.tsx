import LottieView from "lottie-react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import ic from "@/assets/lotties/ic_brand.json"
import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { Text, StyleSheet, Animated, Easing } from "react-native"
import { useEffect, useRef } from "react"

export default function SplashScreen({
  onFinish = (isCancelled) => {},
}: {
  onFinish: (isCancelled: boolean) => void
}) {
  const fade = useRef(new Animated.Value(0)).current
  const translate = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start()
  }, [fade, translate])

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LottieView
        onAnimationFinish={onFinish}
        source={ic}
        autoPlay
        loop={false}
        duration={3000}
        style={styles.lottie}
      />

      <Animated.View
        style={[
          styles.brand,
          { opacity: fade, transform: [{ translateY: translate }] },
        ]}
      >
        <Text style={styles.brandTitle}>
          Stop{" "}
          <Text style={{ color: Theme.colors.primarySoft }}>Trivia</Text>
        </Text>
        <Text style={styles.tagline}>Quick thinking · Word games</Text>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: "55%",
    aspectRatio: 1,
    maxHeight: 280,
  },
  brand: {
    alignItems: "center",
    gap: Theme.spacing.s,
    marginTop: -Theme.spacing.l,
  },
  brandTitle: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.display,
    color: Theme.colors.text,
  },
  tagline: {
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    color: Theme.colors.gray,
    letterSpacing: 0.4,
  },
})