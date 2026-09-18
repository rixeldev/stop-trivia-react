import { Dimensions, View } from "react-native"
import Svg, { Rect } from "react-native-svg"
import { Theme } from "@/constants/Theme"

interface Props {
  progress: number
  width?: number
}

export const ProgressBar = ({ progress, width }: Props) => {
  const barWidth = width ?? Math.min(Dimensions.get("window").width - 120, 260)
  const clamped = Math.max(0, Math.min(100, progress))
  const progressWidth = (clamped / 100) * barWidth

  return (
    <View>
      <Svg width={barWidth} height="8">
        <Rect
          width={barWidth}
          height="100%"
          fill={Theme.colors.surfaceHigh}
          rx={4}
          ry={4}
        />
        <Rect
          width={progressWidth}
          height="100%"
          fill={Theme.colors.primarySoft}
          rx={4}
          ry={4}
        />
      </Svg>
    </View>
  )
}