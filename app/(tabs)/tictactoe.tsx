import { Theme } from "@/constants/Theme"
import React, { useCallback, useEffect, useState } from "react"
import {
  View,
  Text,
  Vibration,
  Pressable,
  Keyboard,
  ActivityIndicator,
  ToastAndroid,
} from "react-native"
import {
  ComputerIcon,
  LinkIcon,
  OfflineIcon,
  OnlineIcon,
} from "@/components/ui/Icons"
import { Screen } from "@/components/ui/Screen"
import { useFocusEffect, useRouter } from "expo-router"
import { useStorage } from "@/hooks/useStorage"
import { parseBoolean } from "@/libs/parseBoolean"
import LottieView from "lottie-react-native"
import ic from "@/assets/lotties/ic_gamepad.json"
import { ModesButton } from "@/components/ModesButton"
import { FocusInput } from "@/components/FocusInput"
import Fire from "@/db/Fire"
import { GameStatus, TTTModel } from "@/interfaces/Game"
import { useTranslation } from "react-i18next"
import NetInfo from "@react-native-community/netinfo"

export default function TicTacToe() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [id, setId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handlePress = (flag: string) => {
    if (loading) return

    vibrationEnabled && Vibration.vibrate(10)
    setError(null)

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

      setLoading(false)
      setError(null)
      setId("")
      setOnlineLoading(false)
      navigate({
        pathname: "ttt",
        params: { mode: flag, id },
      })
    }

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
        Fire.getGame("ttt", id).then((game) => {
          let gameGot: TTTModel = game as TTTModel

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
              pathname: "ttt",
              params: {
                mode: flag,
                id: gameGot.gameId,
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
        pathname: "ttt",
        params: { mode: flag, id },
      })
    }

    if (flag === "computer") {
      setLoading(false)
      setError(null)
      setId("")

      navigate({
        pathname: "ttt",
        params: { mode: flag, id },
      })
    }
  }

  return (
    <Screen>
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
            {t("choose_your_mode")} Tic Tac Toe
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
          {/* <ModesButton
            icon={<ComputerIcon size={32} color={Theme.colors.accent} />}
            title={t("play_computer")}
            flag="computer"
            image="tttComputer"
            onPress={() => handlePress("computer")}
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
            image="tttOnline"
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
            image="tttJoin"
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
          </ModesButton>*/}

          <ModesButton
            icon={<OfflineIcon size={32} color={Theme.colors.accent} />}
            title={t("play_offline")}
            subtitle={t("play_offline_desc")}
            flag="offline"
            image="tttOffline"
            onPress={() => handlePress("offline")}
          />
        </View>
      </Pressable>
    </Screen>
  )
}
