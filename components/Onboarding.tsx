import { Theme } from "@/constants/Theme"
import { Slide } from "@/interfaces/Slide"
import { LinearGradient } from "expo-linear-gradient"
import LottieView from "lottie-react-native"
import { useTranslation } from "react-i18next"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import AppIntroSlider from "react-native-app-intro-slider"
import ic from "@/assets/lotties/ic_brand.json"
import { useStorage } from "@/hooks/useStorage"
import { useEffect, useRef, useState } from "react"

interface Props {
  onDone: () => void
}

const OnboardingImages = {
  en: {
    modes: require("@/assets/onboarding/en/onboarding-modes.png"),
    avatar: require("@/assets/onboarding/en/onboarding-avatar.png"),
    stop: require("@/assets/onboarding/en/onboarding-stop.png"),
  },
  es: {
    modes: require("@/assets/onboarding/es/onboarding-modes.png"),
    avatar: require("@/assets/onboarding/es/onboarding-avatar.png"),
    stop: require("@/assets/onboarding/es/onboarding-stop.png"),
  },
}

export function Onboarding({ onDone }: Props) {
  const { t } = useTranslation()
  const { getItem } = useStorage()
  const [language, setLanguage] = useState<"en" | "es">("en")
  const sliderRef = useRef<AppIntroSlider>(null)

  useEffect(() => {
    const loadLanguage = async () => {
      const saved = await getItem("language")
      if (saved === "es" || saved === "en") {
        setLanguage(saved)
      }
    }
    loadLanguage()
  }, [])

  const slides: Slide[] = [
    {
      key: "0",
      title: t("onboarding.title0"),
      text: t("onboarding.text0"),
      backgroundColor1: Theme.colors.background,
      backgroundColor2: Theme.colors.surface,
    },
    {
      key: "1",
      title: t("onboarding.title1"),
      text: t("onboarding.text1"),
      image: OnboardingImages[language].modes,
      backgroundColor1: Theme.colors.surface,
      backgroundColor2: Theme.colors.background,
    },
    {
      key: "2",
      title: t("onboarding.title2"),
      text: t("onboarding.text2"),
      image: OnboardingImages[language].avatar,
      backgroundColor1: Theme.colors.background,
      backgroundColor2: Theme.colors.surface,
    },
    {
      key: "3",
      title: t("onboarding.title3"),
      text: t("onboarding.text3"),
      image: OnboardingImages[language].stop,
      backgroundColor1: Theme.colors.surface,
      backgroundColor2: Theme.colors.background,
    },
  ]

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <LinearGradient
        style={{
          width: "100%",
          height: "100%",
        }}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        colors={[item.backgroundColor1, item.backgroundColor2]}
      >
        <View style={styles.slide}>
          {item.key === "0" && (
            <LottieView
              source={ic}
              autoPlay
              loop={false}
              duration={3000}
              style={{
                width: "46%",
                aspectRatio: 1,
                marginVertical: Theme.spacing.l,
                ...Theme.shadows.glow,
              }}
            />
          )}

          <Text style={styles.title}>{item.title}</Text>
          {item.key !== "0" && (
            <Image source={item.image} style={styles.image} />
          )}
          <Text style={styles.text}>{item.text}</Text>
        </View>
      </LinearGradient>
    )
  }

  const buttonLabel = (label: string, primary = false) => {
    return (
      <View
        style={[
          styles.buttonChip,
          primary && styles.buttonChipPrimary,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            primary && styles.buttonTextPrimary,
          ]}
        >
          {label}
        </Text>
      </View>
    )
  }

  return (
    <AppIntroSlider
      ref={sliderRef}
      data={slides}
      renderItem={renderItem}
      onDone={onDone}
      activeDotStyle={{
        backgroundColor: Theme.colors.primarySoft,
        width: 26,
        height: 8,
        borderRadius: 4,
      }}
      dotStyle={{
        backgroundColor: Theme.colors.darkGray,
        width: 8,
        height: 8,
        borderRadius: 4,
      }}
      renderPagination={(activeIndex) => {
        const isLastSlide = activeIndex === slides.length - 1
        return (
          <View style={styles.paginationContainer}>
            <View style={styles.paginationDots}>
              {slides.map((slide, i) => (
                <View
                  key={slide.key}
                  style={[
                    styles.dot,
                    i === activeIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
            <Pressable
              style={styles.rightButtonContainer}
              onPress={() =>
                isLastSlide
                  ? onDone()
                  : sliderRef.current?.goToSlide(activeIndex + 1)
              }
            >
              {isLastSlide
                ? buttonLabel(t("done"), true)
                : buttonLabel(t("next"), true)}
            </Pressable>
            {!isLastSlide && (
              <Pressable
                style={styles.leftButtonContainer}
                onPress={() => sliderRef.current?.goToSlide(slides.length - 1)}
              >
                {buttonLabel(t("skip"))}
              </Pressable>
            )}
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: Theme.sizes.hero,
    fontFamily: Theme.fonts.onestBold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
    textAlign: "center",
    textShadowColor: Theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  text: {
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    textAlign: "center",
    paddingHorizontal: Theme.spacing.xxxl,
    lineHeight: 22,
  },
  image: {
    width: 400,
    height: 400,
    resizeMode: "contain",
    marginBottom: Theme.spacing.xl,
  },
  buttonChip: {
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.radii.pill,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    backgroundColor: Theme.colors.surface,
  },
  buttonChipPrimary: {
    backgroundColor: Theme.colors.surfaceHigh,
    borderColor: Theme.colors.primarySoft,
  },
  buttonText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h4,
  },
  buttonTextPrimary: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    justifyContent: "center",
  },
  paginationDots: {
    height: 16,
    margin: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Theme.colors.primarySoft,
    width: 26,
  },
  dotInactive: {
    backgroundColor: Theme.colors.darkGray,
  },
  leftButtonContainer: {
    position: "absolute",
    left: 0,
  },
  rightButtonContainer: {
    position: "absolute",
    right: 0,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})