import { Theme } from "@/constants/Theme"
import { View } from "react-native"

export const Divider = ({ inset = 0 }: { inset?: number }) => {
  return (
    <View
      style={{
        width: "100%",
        height: 1,
        backgroundColor: Theme.colors.borderSoft,
        marginLeft: inset,
        marginRight: inset,
        opacity: 0.6,
      }}
    />
  )
}