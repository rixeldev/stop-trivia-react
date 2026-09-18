import { Theme } from "@/constants/Theme"
import { LinearGradient } from "expo-linear-gradient"
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native"

interface Props {
  children: React.ReactNode
  padding?: number
}

export function Screen({ children, padding }: Props) {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <LinearGradient
        colors={Theme.gradients.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          { padding: padding ?? Theme.spacing.l },
        ]}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    width: "100%",
  },
  content: {
    flex: 1,
    width: "100%",
    backgroundColor: Theme.colors.transparent,
  },
})