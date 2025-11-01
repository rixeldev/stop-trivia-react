import { Theme } from "@/constants/Theme"
import { Slide } from "@/interfaces/Slide"
import { LinearGradient } from "expo-linear-gradient"
import LottieView from "lottie-react-native"
import { useTranslation } from "react-i18next"
import { Image, StyleSheet, Text, View } from "react-native"
import AppIntroSlider from "react-native-app-intro-slider"
import ic from "@/assets/lotties/ic_brand.json"
import { useStorage } from "@/hooks/useStorage"
import { useEffect, useState } from "react"

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
      backgroundColor2: Theme.colors.modal,
    },
    {
      key: "1",
      title: t("onboarding.title1"),
      text: t("onboarding.text1"),
      image: OnboardingImages[language].modes,
      backgroundColor1: Theme.colors.modal,
      backgroundColor2: Theme.colors.background2,
    },
    {
      key: "2",
      title: t("onboarding.title2"),
      text: t("onboarding.text2"),
      image: OnboardingImages[language].avatar,
      backgroundColor1: Theme.colors.background2,
      backgroundColor2: Theme.colors.modal,
    },
    {
      key: "3",
      title: t("onboarding.title3"),
      text: t("onboarding.text3"),
      image: OnboardingImages[language].stop,
      backgroundColor1: Theme.colors.modal,
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
              style={{ width: "50%", aspectRatio: 1, marginVertical: 12 }}
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

  const buttonLabel = (label: string) => {
    return (
      <View style={{ padding: 12 }}>
        <Text
          style={{
            color: Theme.colors.text,
            fontFamily: Theme.fonts.onestBold,
            fontSize: Theme.sizes.h4,
          }}
        >
          {label}
        </Text>
      </View>
    )
  }

  return (
    <AppIntroSlider
      data={slides}
      renderItem={renderItem}
      onDone={onDone}
      showSkipButton={true}
      activeDotStyle={{ backgroundColor: Theme.colors.accent, width: 22 }}
      dotStyle={{ backgroundColor: Theme.colors.darkGray }}
      renderSkipButton={() => buttonLabel(t("skip"))}
      renderNextButton={() => buttonLabel(t("next"))}
      renderDoneButton={() => buttonLabel(t("done"))}
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
    fontSize: Theme.sizes.h0,
    fontFamily: Theme.fonts.onestBold,
    color: Theme.colors.text,
    marginBottom: 20,
  },
  text: {
    fontSize: Theme.sizes.h4,
    fontFamily: Theme.fonts.onest,
    color: Theme.colors.gray,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 400,
    height: 400,
    resizeMode: "contain",
    marginBottom: 40,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
