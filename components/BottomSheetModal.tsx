import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { Pressable, ScrollView, Text, View } from "react-native"
import { Divider } from "@/components/Divider"
import { Theme } from "@/constants/Theme"
import React, { forwardRef, useCallback, useMemo } from "react"
import { CloseIcon } from "./ui/Icons"

interface Props {
  children: React.ReactNode
  title: string
}

export const BottomSheetModal = forwardRef<BottomSheet, Props>(
  ({ title, children }: Props, ref: any) => {
    const snapPoint = useMemo(() => ["25%", "50%"], [])
    const backDrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      []
    )

    return (
      <BottomSheet
        handleIndicatorStyle={{ backgroundColor: Theme.colors.gray }}
        backgroundStyle={{ backgroundColor: Theme.colors.modal }}
        ref={ref}
        snapPoints={snapPoint}
        index={-1}
        backdropComponent={backDrop}
        enablePanDownToClose={true}
      >
        <BottomSheetView
          style={{
            flex: 1,
            flexDirection: "column",
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              paddingHorizontal: 12,
              alignItems: "center",
            }}
          >
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              onPress={() => ref?.current?.close()}
            >
              <CloseIcon size={28} color={Theme.colors.gray} />
            </Pressable>
            <Text
              style={{
                color: Theme.colors.text,
                fontFamily: Theme.fonts.onestBold,
                fontSize: Theme.sizes.h3,
              }}
            >
              {title}
            </Text>
          </View>

          <Divider />

          <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
        </BottomSheetView>
      </BottomSheet>
    )
  }
)

BottomSheetModal.displayName = "BottomSheetModal"
