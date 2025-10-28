import { Theme } from "@/constants/Theme"
import React, { useCallback, useEffect, useState } from "react"
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
} from "react-native"
import { LinkIcon, OfflineIcon, OnlineIcon } from "@/components/ui/Icons"
import { Screen } from "@/components/ui/Screen"
import { useFocusEffect, useRouter } from "expo-router"
import { useStorage } from "@/hooks/useStorage"
import { parseBoolean } from "@/libs/parseBoolean"
import LottieView from "lottie-react-native"
import ic from "@/assets/lotties/ic_gamepad.json"
import { ModesButton } from "@/components/ModesButton"
import { FocusInput } from "@/components/FocusInput"
import Fire from "@/db/Fire"
import { GameStatus, StopModel } from "@/interfaces/Game"
import { useTranslation } from "react-i18next"
import NetInfo from "@react-native-community/netinfo"

export default function Index() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [id, setId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [connection, setConnection] = useState(true)

  const { navigate } = useRouter()
  const { getItem } = useStorage()
  const { t } = useTranslation()

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const vibrationValue = await getItem("vibration")
        setVibrationEnabled(parseBoolean(vibrationValue))
      }
      loadSettings()
    }, [])
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

    if (flag === "join") {
      if (!connection) {
        ToastAndroid.showWithGravity(
          t("you_are_offline"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        )
        return
      }

      setLoading(true)

      if (id.length !== 6) {
        vibrationEnabled && Vibration.vibrate(100)
        setError(t("error_game_invalid_code"))
        setLoading(false)
        return
      }

      id.length === 6 &&
        Fire.getGame("stop", id).then((game) => {
          let gameGot: StopModel = game as StopModel

          if (!gameGot) {
            vibrationEnabled && Vibration.vibrate(100)
            setError(t("error_game_not_found"))
            setLoading(false)
            return
          }

          if (gameGot.players.length >= 4) {
            vibrationEnabled && Vibration.vibrate(100)
            setError(t("error_game_full"))
            setLoading(false)
            return
          }

          if (gameGot) {
            if (gameGot.gameStatus === GameStatus.IN_PROGRESS) {
              vibrationEnabled && Vibration.vibrate(100)
              setError(t("error_game_started"))
              setLoading(false)
              return
            }

            setLoading(false)
            setError(null)
            setId("")

            navigate({
              pathname: "stop",
              params: {
                mode: flag,
                id: gameGot.gameId,
                time: gameGot.currentTime,
              },
            })
          }
        })
    }

    if (flag === "offline") {
      setLoading(false)
      setError(null)
      setId("")

      navigate({
        pathname: "stop",
        params: { mode: flag, id, time },
      })
    }

    if (flag === "online") {
      if (!connection) {
        ToastAndroid.showWithGravity(
          t("you_are_offline"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        )
        return
      }

      if (onlineLoading) return

      setOnlineLoading(true)
      setModalVisible(true)
    }
  }

  const handleCreateGame = (mode: string, id: string, time: number) => {
    vibrationEnabled && Vibration.vibrate(10)

    setLoading(false)
    setError(null)
    setId("")
    setOnlineLoading(false)
    setModalVisible(false)
    navigate({
      pathname: "stop",
      params: { mode, id, time },
    })
  }

  return (
    <Screen>
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
          <View style={styles.centeredView}>
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                <Text
                  style={{
                    color: Theme.colors.accent,
                    fontFamily: Theme.fonts.onestBold,
                    fontSize: Theme.sizes.h3,
                    alignSelf: "center",
                    marginBottom: 16,
                  }}
                >
                  {t("select_time")}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => handleCreateGame("online", id, 60)}
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.6 : 1 },
                      styles.buttons,
                    ]}
                  >
                    <Text style={styles.texts}>1 min</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleCreateGame("online", id, 180)}
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.6 : 1 },
                      styles.buttons,
                    ]}
                  >
                    <Text style={styles.texts}>3 mins</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleCreateGame("online", id, 300)}
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.6 : 1 },
                      styles.buttons,
                    ]}
                  >
                    <Text style={styles.texts}>5 mins</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          id === "" && setError(null)
          Keyboard.dismiss()
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 16,
            marginBottom: 26,
            gap: 12,
          }}
        >
          <LottieView
            source={ic}
            autoPlay
            loop={false}
            duration={2000}
            style={{
              width: 24,
              height: 24,
            }}
          />

          <Text
            style={{
              color: Theme.colors.text,
              fontSize: Theme.sizes.h3,
              fontFamily: Theme.fonts.onest,
            }}
          >
            {t("choose_your_mode")} Stop
          </Text>

          <LottieView
            source={ic}
            autoPlay
            loop={false}
            duration={2000}
            style={{
              width: 24,
              height: 24,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <ModesButton
            icon={<OfflineIcon size={32} color={Theme.colors.accent} />}
            title={t("play_offline")}
            subtitle={t("play_offline_desc")}
            flag="offline"
            image="stopOffline"
            onPress={() => handlePress("offline")}
          />
          <ModesButton
            icon={<OnlineIcon size={32} color={Theme.colors.accent} />}
            rightIcon={
              onlineLoading ? (
                <ActivityIndicator
                  color={Theme.colors.accent}
                  style={{ width: 32, height: 32 }}
                ></ActivityIndicator>
              ) : undefined
            }
            title={t("play_online")}
            subtitle={t("play_online_desc")}
            flag="online"
            image="stopOnline"
            onPress={() => handlePress("online")}
          />
          <ModesButton
            icon={<LinkIcon size={32} color={Theme.colors.accent} />}
            rightIcon={
              loading ? (
                <ActivityIndicator
                  color={Theme.colors.accent}
                  style={{ width: 32, height: 32 }}
                ></ActivityIndicator>
              ) : undefined
            }
            title={t("join_game")}
            flag="join"
            onPress={() => handlePress("join")}
          >
            <FocusInput
              editable={!loading}
              value={id}
              capitalize="none"
              onChange={handleCodeChange}
              placeholder="Code"
              type="default"
            />

            {error && (
              <Text
                style={{
                  color: Theme.colors.red,
                  fontFamily: Theme.fonts.onest,
                  fontSize: Theme.sizes.h5,
                }}
              >
                {error}
              </Text>
            )}
          </ModesButton>
        </View>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  columns: {
    flex: 1,
    flexDirection: "column",
    gap: 18,
  },
  buttons: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: "flex-start",
    backgroundColor: Theme.colors.primary2,
  },
  texts: {
    color: Theme.colors.lightGray,
    alignSelf: "flex-start",
    fontFamily: Theme.fonts.onestBold,
  },
  modalView: {
    margin: 20,
    backgroundColor: Theme.colors.modal,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalBottomButtons: {
    padding: 12,
    borderRadius: 16,
  },
})
