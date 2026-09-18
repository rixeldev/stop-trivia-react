import { Theme } from "@/constants/Theme"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  Vibration,
  Pressable,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ToastAndroid,
  ScrollView,
} from "react-native"
import {
  ForwardIcon,
  GameIcon,
  HashIcon,
  LinkIcon,
  UsersIcon,
  AddIcon,
  RemoveIcon,
} from "@/components/ui/Icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useStorage } from "@/hooks/useStorage"
import { parseBoolean } from "@/libs/parseBoolean"
import LottieView from "lottie-react-native"
import ic_gamepad from "@/assets/lotties/ic_gamepad.json"
import ic_launcher from "@/assets/lotties/ic_brand.json"
import { ModesButton } from "@/components/ModesButton"
import { FocusInput } from "@/components/FocusInput"
import { Badge } from "@/components/ui/Badge"
import Fire from "@/db/Fire"
import { GameStatus, StopModel, TTTModel } from "@/interfaces/Game"
import { useTranslation } from "react-i18next"
import NetInfo from "@react-native-community/netinfo"
import { Screen } from "@/components/ui/Screen"
import { WhiteSpace } from "@/components/WhiteSpace"
import BottomSheet from "@gorhom/bottom-sheet"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import { LinearGradient } from "expo-linear-gradient"

const timeOptions = [
  { value: 60, label: "1" },
  { value: 180, label: "3" },
  { value: 300, label: "5" },
]

const MIN_ROUNDS = 1
const MAX_ROUNDS = 20
const DEFAULT_ROUNDS = 10

export default function Index() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [id, setId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [connection, setConnection] = useState(true)
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS)

  const { navigate } = useRouter()
  const { getItem } = useStorage()
  const { t } = useTranslation()

  const sheetRef = useRef<BottomSheet>(null)

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const vibrationValue = await getItem("vibration")
        setVibrationEnabled(parseBoolean(vibrationValue))
      }
      loadSettings()
    }, []),
  )

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnection(state.isConnected ?? false)
    })

    return unsubscribe()
  }, [])

  const handleCodeChange = (text: string) => {
    setError(null)
    setId(text.trim().toLocaleLowerCase())
  }

  const handlePress = (flag: string, time: number = 300) => {
    if (loading) return

    vibrationEnabled && Vibration.vibrate(10)
    setError(null)

    if (flag === "stop-online") {
      if (!connection) {
        ToastAndroid.showWithGravity(
          t("you_are_offline"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
        return
      }

      if (onlineLoading) return

      setOnlineLoading(true)
      setModalVisible(true)

      return
    }

    if (flag === "ttt-online") {
      if (!connection) {
        ToastAndroid.showWithGravity(
          t("you_are_offline"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
        return
      }

      if (onlineLoading) return

      setOnlineLoading(true)
      navigate({
        pathname: "ttt",
        params: { mode: flag.split("-")[1], id },
      })
      setOnlineLoading(false)

      return
    }

    if (flag === "stop-join") {
      if (!connection) {
        ToastAndroid.showWithGravity(
          t("you_are_offline"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
        sheetRef.current?.close()
        return
      }

      setLoading(true)

      if (id.length !== 6) {
        vibrationEnabled && Vibration.vibrate(100)
        setError(t("error_game_invalid_code"))
        setLoading(false)
        sheetRef.current?.close()
        return
      }

      if (id.length === 6) {
        Fire.getGame("stop", id).then((game) => {
          let gameGot: StopModel = game as StopModel

          if (!gameGot) {
            vibrationEnabled && Vibration.vibrate(100)
            setError(t("error_game_not_found"))
            setLoading(false)
            sheetRef.current?.close()
            return
          }

          if (gameGot.players.length >= 4) {
            vibrationEnabled && Vibration.vibrate(100)
            setError(t("error_game_full"))
            setLoading(false)
            sheetRef.current?.close()
            return
          }

          if (gameGot) {
            if (gameGot.gameStatus === GameStatus.IN_PROGRESS) {
              vibrationEnabled && Vibration.vibrate(100)
              setError(t("error_game_started"))
              setLoading(false)
              sheetRef.current?.close()
              return
            }

            if (gameGot.finished) {
              vibrationEnabled && Vibration.vibrate(100)
              setError(t("error_game_closed"))
              setLoading(false)
              sheetRef.current?.close()
              return
            }

            setLoading(false)
            setError(null)
            setId("")
            sheetRef.current?.close()

            navigate({
              pathname: "stop",
              params: {
                mode: flag.split("-")[1],
                id: gameGot.gameId,
                time: gameGot.currentTime,
              },
            })
          }
        })
      }
    }

    if (flag === "ttt-join") {
      if (!connection) {
        ToastAndroid.showWithGravity(
          t("you_are_offline"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
        sheetRef.current?.close()
        return
      }

      setLoading(true)

      if (id.length !== 6) {
        vibrationEnabled && Vibration.vibrate(100)
        setError(t("error_game_invalid_code"))
        setLoading(false)
        sheetRef.current?.close()
        return
      }

      if (id.length === 6) {
        Fire.getGame("ttt", id).then((game) => {
          let gameGot: TTTModel = game as TTTModel

          if (!gameGot) {
            vibrationEnabled && Vibration.vibrate(100)
            setError(t("error_game_not_found"))
            setLoading(false)
            sheetRef.current?.close()
            return
          }

          if (gameGot.players.length >= 4) {
            vibrationEnabled && Vibration.vibrate(100)
            setError(t("error_game_full"))
            setLoading(false)
            sheetRef.current?.close()
            return
          }

          if (gameGot) {
            if (gameGot.gameStatus === GameStatus.IN_PROGRESS) {
              vibrationEnabled && Vibration.vibrate(100)
              setError(t("error_game_started"))
              setLoading(false)
              sheetRef.current?.close()
              return
            }

            setLoading(false)
            setError(null)
            setId("")
            sheetRef.current?.close()

            navigate({
              pathname: "ttt",
              params: {
                mode: flag.split("-")[1],
                id: gameGot.gameId,
              },
            })
          }
        })
      }
    }
  }

  const handleCreateStopGame = (
    mode: string,
    id: string,
    time: number,
    totalRounds: number,
  ) => {
    vibrationEnabled && Vibration.vibrate(10)

    setLoading(false)
    setError(null)
    setId("")
    setOnlineLoading(false)
    setModalVisible(false)
    navigate({
      pathname: "stop",
      params: { mode, id, time, rounds: totalRounds },
    })
  }

  const handleBottomSheet = () => {
    if (!id || id === "") {
      vibrationEnabled && Vibration.vibrate(100)
      ToastAndroid.showWithGravity(
        t("error_game_invalid_code"),
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      )
      return
    }

    sheetRef.current?.expand()
  }

  return (
    <Screen padding={0}>
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false)
          setOnlineLoading(false)
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible(false)
            setOnlineLoading(false)
          }}
        >
          <LinearGradient
            colors={Theme.gradients.overlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.centeredView}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>{t("select_time")}</Text>
                <Text style={styles.modalSubtitle}>
                  {t("play_stop_online_desc")}
                </Text>

                <View style={{ flexDirection: "row", gap: Theme.spacing.s }}>
                  {timeOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        handleCreateStopGame("online", id, option.value, rounds)
                      }
                      style={({ pressed }) => [
                        { opacity: pressed ? 0.8 : 1 },
                        styles.timeBtn,
                      ]}
                    >
                      <Text style={styles.timeValue}>{option.label}</Text>
                      <Text style={styles.timeUnit}>min</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.roundsDivider} />

                <Text style={styles.roundsLabel}>{t("rounds")}</Text>

                <View style={styles.roundsRow}>
                  <Pressable
                    onPress={() =>
                      setRounds((current) => Math.max(MIN_ROUNDS, current - 1))
                    }
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.7 : 1 },
                      styles.roundStepBtn,
                    ]}
                  >
                    <RemoveIcon size={22} color={Theme.colors.primarySoft} />
                  </Pressable>

                  <View style={styles.roundValueChip}>
                    <Text style={styles.roundValue}>{rounds}</Text>
                    <Text style={styles.roundUnit}>{t("rounds")}</Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setRounds((current) => Math.min(MAX_ROUNDS, current + 1))
                    }
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.7 : 1 },
                      styles.roundStepBtn,
                    ]}
                  >
                    <AddIcon size={22} color={Theme.colors.primarySoft} />
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </LinearGradient>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            id === "" && setError(null)
            Keyboard.dismiss()
          }}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Badge>Online</Badge>
            </View>

            <LottieView
              source={ic_gamepad}
              autoPlay
              loop={false}
              duration={2000}
              style={styles.heroLottie}
            />

            <Text style={styles.heroTitle}>{t("online_modes")}</Text>
            <Text style={styles.heroSubtitle}>
              {t("choose_your_mode")} Stop Trivia
            </Text>
          </View>

          <View style={styles.modes}>
            <ModesButton
              icon={
                <LottieView
                  source={ic_launcher}
                  autoPlay
                  loop={false}
                  duration={3000}
                  style={{ width: 32, height: 32 }}
                />
              }
              rightIcon={
                onlineLoading ? (
                  <ActivityIndicator
                    color={Theme.colors.primarySoft}
                    style={{ width: 26, height: 26 }}
                  />
                ) : undefined
              }
              title={`Stop ${t("online")}`}
              subtitle={t("play_stop_online_desc")}
              flag="stop-online"
              image="stopOnline"
              onPress={() => handlePress("stop-online")}
            />

            <ModesButton
              icon={<HashIcon size={32} color={Theme.colors.primarySoft} />}
              rightIcon={
                onlineLoading ? (
                  <ActivityIndicator
                    color={Theme.colors.primarySoft}
                    style={{ width: 26, height: 26 }}
                  />
                ) : undefined
              }
              title={`Tic Tac Toe ${t("online")}`}
              subtitle={t("play_ttt_online_desc")}
              flag="ttt-online"
              image="tttOnline"
              onPress={() => handlePress("ttt-online")}
            />

            <ModesButton
              icon={<LinkIcon size={32} color={Theme.colors.primarySoft} />}
              rightIcon={
                loading ? (
                  <ActivityIndicator
                    color={Theme.colors.yellow}
                    style={{ width: 26, height: 26 }}
                  />
                ) : undefined
              }
              title={t("join_game")}
              flag="join"
              onPress={handleBottomSheet}
            >
              <View style={styles.joinBox}>
                <View style={styles.joinLabelRow}>
                  <UsersIcon size={16} color={Theme.colors.primarySoft} />
                  <Text style={styles.joinLabel}>Code</Text>
                </View>

                <FocusInput
                  editable={!loading}
                  value={id}
                  capitalize="none"
                  onChange={handleCodeChange}
                  placeholder="XXXXXX"
                  type="default"
                  returnKeyType="done"
                  onSubmitEditing={handleBottomSheet}
                />

                {error && <Text style={styles.error}>{error}</Text>}
              </View>
            </ModesButton>
          </View>

          <WhiteSpace />
        </Pressable>
      </ScrollView>

      <BottomSheetModal
        title={t("join")}
        ref={sheetRef}
        icon={<LinkIcon size={24} color={Theme.colors.primarySoft} />}
      >
        <View style={{ marginBottom: 8, gap: Theme.spacing.s }}>
          <JoinRow
            label={`Stop ${t("online")}`}
            icon={<GameIcon size={24} color={Theme.colors.primarySoft} />}
            onPress={() => handlePress("stop-join")}
          />
          <JoinRow
            label={`Tic Tac Toe ${t("online")}`}
            icon={<HashIcon size={24} color={Theme.colors.primarySoft} />}
            onPress={() => handlePress("ttt-join")}
          />
        </View>
      </BottomSheetModal>
    </Screen>
  )
}

const JoinRow = ({
  label,
  icon,
  onPress,
}: {
  label: string
  icon: React.ReactNode
  onPress: () => void
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.75 : 1,
          backgroundColor: Theme.colors.surfaceHigh,
          padding: Theme.spacing.l,
          borderRadius: Theme.radii.lg,
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          gap: Theme.spacing.m,
          borderWidth: 1,
          borderColor: Theme.colors.borderSoft,
        },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: Theme.radii.m,
          backgroundColor: Theme.colors.surface,
          borderWidth: 1,
          borderColor: Theme.colors.borderSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      <Text
        style={{
          flex: 1,
          color: Theme.colors.text,
          fontFamily: Theme.fonts.onestBold,
          fontSize: Theme.sizes.h4,
          textAlign: "left",
        }}
      >
        {label}
      </Text>

      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: Theme.colors.primary2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ForwardIcon size={18} color={Theme.colors.yellow} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    height: "100%",
    width: "100%",
    paddingHorizontal: Theme.spacing.l,
  },
  header: {
    alignItems: "center",
    marginTop: Theme.spacing.l,
    marginBottom: Theme.spacing.xxl,
  },
  headerTop: {
    alignSelf: "center",
  },
  heroLottie: {
    width: 64,
    height: 64,
    marginTop: Theme.spacing.m,
  },
  heroTitle: {
    color: Theme.colors.yellow,
    fontSize: Theme.sizes.h0,
    fontFamily: Theme.fonts.onestBold,
    marginTop: Theme.spacing.m,
  },
  heroSubtitle: {
    color: Theme.colors.gray,
    fontSize: Theme.sizes.h5,
    fontFamily: Theme.fonts.onest,
    marginTop: Theme.spacing.xs,
  },
  modes: {
    flexDirection: "column",
    alignItems: "center",
    gap: Theme.spacing.l,
  },
  joinBox: {
    gap: Theme.spacing.m,
    marginTop: Theme.spacing.m,
  },
  joinLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  joinLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  error: {
    color: Theme.colors.red,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalView: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.lg,
  },
  modalTitle: {
    color: Theme.colors.accent,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
    textAlign: "center",
  },
  modalSubtitle: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
    marginVertical: Theme.spacing.m,
  },
  timeBtn: {
    flex: 1,
    paddingVertical: Theme.spacing.l,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  timeValue: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  timeUnit: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    marginTop: 2,
  },
  roundsDivider: {
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
    marginVertical: Theme.spacing.l,
    opacity: 0.6,
  },
  roundsLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: Theme.spacing.m,
  },
  roundsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.l,
  },
  roundStepBtn: {
    width: 48,
    height: 48,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  roundValueChip: {
    minWidth: 96,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.primarySoft,
    alignItems: "center",
    ...Theme.shadows.glow,
  },
  roundValue: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h2,
    fontVariant: ["tabular-nums"],
  },
  roundUnit: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    marginTop: 2,
  },
})
