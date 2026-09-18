import { Theme } from "@/constants/Theme"
import { ActivityIndicator, StyleSheet, View } from "react-native"

export const Loading = ({ full = true }: { full?: boolean }) => {
  return (
    <View style={[styles.container, !full && styles.inline]}>
      <ActivityIndicator
        size="large"
        color={Theme.colors.primarySoft}
        style={{ width: 38, height: 38, alignSelf: "center" }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inline: {
    flex: 0,
    padding: Theme.spacing.xl,
  },
})