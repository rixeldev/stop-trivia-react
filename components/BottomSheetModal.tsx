import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Divider } from "@/components/Divider"
import { Theme } from "@/constants/Theme"
import React, { forwardRef, useCallback, useMemo } from "react"
import { CloseIcon } from "./ui/Icons"
import { LinearGradient } from "expo-linear-gradient"

interface Props {
  children: React.ReactNode
  title: string
  description?: string
  icon?: React.ReactNode
}

export const BottomSheetModal = forwardRef<BottomSheet, Props>(
  ({ title, description, icon, children }: Props, ref: any) => {
    const snapPoint = useMemo(() => ["25%", "55%"], [])
    const backDrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.7}
        />
      ),
      [],
    )

    return (
      <BottomSheet
        handleIndicatorStyle={{ backgroundColor: Theme.colors.darkGray }}
        backgroundStyle={{
          backgroundColor: Theme.colors.surface,
          borderWidth: 1,
          borderColor: Theme.colors.borderSoft,
          borderTopLeftRadius: Theme.radii.xxl,
          borderTopRightRadius: Theme.radii.xxl,
        }}
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
          }}
        >
          <LinearGradient
            colors={[Theme.colors.primarySoft, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: Theme.spacing.l,
              right: Theme.spacing.l,
              height: 1,
              opacity: 0.5,
            }}
          />

          <View style={styles.header}>
            {icon && <View style={styles.headerTile}>{icon}</View>}

            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              {description && (
                <Text style={styles.headerDescription} numberOfLines={2}>
                  {description}
                </Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.closeTile,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => ref?.current?.close()}
            >
              <CloseIcon size={18} color={Theme.colors.gray} />
            </Pressable>
          </View>

          <Divider />

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    )
  },
)

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: Theme.spacing.m,
    alignItems: "center",
  },
  headerTile: {
    width: 40,
    height: 40,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  headerDescription: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    lineHeight: 15,
  },
  closeTile: {
    width: 40,
    height: 40,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Theme.spacing.l,
    paddingBottom: Theme.spacing.xxxl,
    marginTop: Theme.spacing.m,
  },
})

BottomSheetModal.displayName = "BottomSheetModal"
