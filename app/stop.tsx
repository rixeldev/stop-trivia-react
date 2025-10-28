import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  Image,
  ToastAndroid,
  BackHandler,
  NativeEventSubscription,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
} from "react-native"
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router"
import {
  BackIcon,
  CheckIcon,
  CopyIcon,
  OfflineIcon,
  PlayIcon,
  RestartIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/Icons"
import { Screen } from "@/components/ui/Screen"
import { Theme } from "@/constants/Theme"
import { FocusInput } from "@/components/FocusInput"
import { PlayingButton } from "@/components/PlayingButton"
import Fire from "@/db/Fire"
import { sixDigit } from "@/libs/randomId"
import { StopModel, GameStatus } from "@/interfaces/Game"
import { getAuth } from "@react-native-firebase/auth"
import { formatTime } from "@/libs/formatTime"
import { useStorage } from "@/hooks/useStorage"
import { parseBoolean } from "@/libs/parseBoolean"
import { useTranslation } from "react-i18next"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import BottomSheet from "@gorhom/bottom-sheet"
import { CustomModal } from "@/components/CustomModal"
import Clipboard from "@react-native-clipboard/clipboard"
import NetInfo from "@react-native-community/netinfo"
import { Player } from "@/interfaces/Player"
import { PlayerInputsInfoModal } from "@/components/PlayerInputsInfoModal"
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads"
import { Loading } from "@/components/Loading"

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-5333671658707378/4722063158"

export default function Stop() {
  const [gameData, setGameData] = useState<StopModel | null>(null)
  const [points, setPoints] = useState<number>(0)
  const [title, setTitle] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | string>(3)
  const [timeLeft, setTimeLeft] = useState<number>(300)
  const [letter, setLetter] = useState<string>("-")
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>()
  const [closeModalVisible, setCloseModalVisible] = useState<boolean>(false)
  const [restartModalVisible, setRestartModalVisible] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false)
  const [isStarting, setIsStarting] = useState(false)
  const [connection, setConnection] = useState<boolean>(true)
  const [timerColor, setTimerColor] = useState(Theme.colors.gray)
  const [inputsPlayer, setInputsPlayer] = useState<Player | null>(null)
  const [inputsModalVisible, setInputsModalVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [inputs, setInputs] = useState({
    name: "",
    lastName: "",
    country: "",
    color: "",
    animal: "",
    artist: "",
    food: "",
    fruit: "",
    object: "",
    profession: "",
  })

  const scaleAnim = useRef(new Animated.Value(1)).current
  const sheetRef = useRef<BottomSheet>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownStarted = useRef(false)
  const currentInputsRef = useRef(inputs)
  const backHandlerRef = useRef<NativeEventSubscription | null>(null)

  const navigation = useNavigation()
  const { getItem } = useStorage()
  const { t } = useTranslation()
  const { mode, id, time } = useLocalSearchParams<{
    mode: string
    id: string
    time: string
  }>()

  const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    keywords: ["games", "gaming", "multiplayer", "action", "android"],
  })

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true)
        if (Math.floor(Math.random() * 100) >= 50) {
          interstitial.show()
        }
      }
    )

    const unsubscribeOpened = interstitial.addAdEventListener(
      AdEventType.OPENED,
      () => {
        if (Platform.OS === "ios") {
          StatusBar.setHidden(true)
        }
      }
    )

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        if (Platform.OS === "ios") {
          StatusBar.setHidden(false)
        }
      }
    )

    interstitial.load()

    return () => {
      unsubscribeLoaded()
      unsubscribeOpened()
      unsubscribeClosed()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const vibrationValue = await getItem("vibration")
        setVibrationEnabled(parseBoolean(vibrationValue))
      }
      loadSettings()
    }, [])
  )

  useFocusEffect(
    useCallback(() => {
      const backPress = () => handleBackPress()
      backHandlerRef.current = BackHandler.addEventListener(
        "hardwareBackPress",
        backPress
      )

      return () => {
        if (backHandlerRef.current) {
          backHandlerRef.current.remove()
          backHandlerRef.current = null
        }
      }
    }, [gameData, mode, vibrationEnabled])
  )

  useEffect(() => {
    currentInputsRef.current = inputs
  }, [inputs])

  useEffect(() => {
    let gameId = id
    let gameTime = +time
    let unsubscribe: (() => void) | undefined
    let connectionUnsubscribe: (() => void) | undefined
    let currentGameData: StopModel
    setTimeLeft(gameTime)

    if (mode === "online") {
      gameId = sixDigit()
      Fire.setGame("stop", gameId, {
        gameId,
        round: 0,
        currentLetter: "-",
        currentTime: gameTime,
        gameStatus: GameStatus.CREATED,
        playersReady: 1,
        players: [
          {
            id: getAuth().currentUser?.uid,
            name: getAuth().currentUser?.displayName,
            points: 0,
            photoURL: getAuth().currentUser?.photoURL!,
            inputs,
          },
        ],
        host: getAuth().currentUser?.uid || "no-host",
        startTime: 0,
        timestamp: Date.now(),
      })
    }

    if (mode === "join") {
      Fire.getGame("stop", gameId).then((data) => {
        if (!data) return
        const userId = getAuth().currentUser?.uid
        const userName = getAuth().currentUser?.displayName
        const alreadyIn = data.players.some((p) => p.id === userId)

        if (!alreadyIn) {
          Fire.updateGame("stop", gameId, {
            players: [
              ...data.players,
              {
                id: userId,
                name: userName,
                points: 0,
                photoURL: getAuth().currentUser?.photoURL!,
                inputs,
              },
            ],
          })
        }
      })
    }

    if (mode !== "offline") {
      unsubscribe = Fire.onGameChange("stop", gameId, (data) => {
        if (!data) {
          if (mode === "join") {
            ToastAndroid.showWithGravity(
              t("host_closed_game"),
              ToastAndroid.SHORT,
              ToastAndroid.CENTER
            )
            navigation.goBack()
            if (timerRef.current) clearInterval(timerRef.current)
          }
          return
        }

        currentGameData = data as StopModel
        setGameData(currentGameData)
        setTitleByGameStatus(connection ? currentGameData.gameStatus : 3)

        if (
          currentGameData.gameStatus === GameStatus.IN_PROGRESS &&
          !countdownStarted.current
        ) {
          countdownStarted.current = true
          if (!isStarting) handleCountdownSync(currentGameData)
          setTimeLeft(currentGameData.currentTime)
          setTimerColor(Theme.colors.gray)
          scaleAnim.stopAnimation()
        }

        if (
          currentGameData.gameStatus === GameStatus.STOPPED &&
          countdownStarted.current
        ) {
          countdownStarted.current = false
          setCountdown(3)
          stopTimer(currentGameData)
        }
      })
    }

    connectionUnsubscribe = NetInfo.addEventListener((state) => {
      setConnection(state.isConnected ?? false)
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
      }

      if (connectionUnsubscribe) {
        connectionUnsubscribe()
        connectionUnsubscribe = undefined
      }

      if (timerRef.current) clearInterval(timerRef.current)

      if (mode === "online" && gameId) {
        Fire.deleteGame("stop", gameId)
      }

      if (mode === "join" && gameId && currentGameData) {
        Fire.updateGame("stop", gameId, {
          players: currentGameData
            ? currentGameData.players.filter(
                (player) => player.id !== getAuth().currentUser?.uid
              )
            : [],
          playersReady:
            currentGameData && currentGameData.playersReady > 1
              ? currentGameData.players.length - 1
              : 1,
        }).catch(() => null)
      }
    }
  }, [])

  const setTitleByGameStatus = (gameStatus: number | undefined) => {
    switch (gameStatus) {
      case GameStatus.CREATED:
        setTitle(t("waiting_players"))
        break
      case GameStatus.IN_PROGRESS:
        setTitle(t("fill_spaces"))
        break
      case GameStatus.STOPPED:
        setTitle("STOP!")
        break
      case 3:
        setTitle(t("connection_lost"))
        break
    }
  }

  const handlePress = async (flag: string) => {
    const userId = getAuth().currentUser?.uid

    if (flag === "play") {
      if (!gameData) return
      if (gameData.host === userId) {
        if (gameData.players.length < 2) {
          vibrationEnabled && Vibration.vibrate(100)
          ToastAndroid.showWithGravity(
            t("you_are_alone"),
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
          )
          return
        }

        if (gameData.players.length !== gameData.playersReady) {
          vibrationEnabled && Vibration.vibrate(100)
          ToastAndroid.showWithGravity(
            t("not_all_players_ready"),
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
          )
          return
        }

        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        const randomLetter = letters.charAt(
          Math.floor(Math.random() * letters.length)
        )
        const serverTime = await Fire.getServerTimeMs(userId)

        await Fire.updateGame("stop", gameData.gameId, {
          gameStatus: GameStatus.IN_PROGRESS,
          currentLetter: randomLetter,
          startTime: serverTime,
        })
      }
      return
    }

    if (flag === "stop") {
      if (!gameData) return
      Fire.updateGame("stop", id, {
        gameStatus: GameStatus.STOPPED,
        playersReady: 1,
      })
      return
    }

    if (flag === "ready") {
      if (!gameData) return
      Fire.updateGame("stop", gameData.gameId, {
        playersReady: gameData.playersReady + 1,
      })

      setReady(true)
    }

    if (flag === "restart") {
      const allEmpty = Object.values(currentInputsRef.current).every(
        (value) => !value || value.trim() === ""
      )
      if (!allEmpty) {
        setRestartModalVisible(true)
      }
    }
  }

  const handleCountdownSync = async (data: StopModel) => {
    let counter = 3

    vibrationEnabled && Vibration.vibrate(30)
    setCountdown(3)
    setIsStarting(true)
    handleRestartInputs()

    Fire.updateGame("stop", data.gameId, {
      round: data.round + 1,
    })

    const offset = await Fire.getServerOffset(data.host)

    timerRef.current = setInterval(() => {
      vibrationEnabled && Vibration.vibrate(30)
      counter--
      setCountdown(counter)

      if (counter === 0) {
        stopCountDown()
        handleTimer(data, offset)
        setCountdown(data.currentLetter)
        setLetter(data.currentLetter)
        setIsStarting(false)
      }
    }, 1000)
  }

  const handleTimer = (data: StopModel, offset: number) => {
    stopCountDown()
    const currentTime = data.currentTime
    const userId = getAuth().currentUser?.uid

    timerRef.current = setInterval(() => {
      const serverNow = Date.now() + offset
      let timeElapsed = Math.floor((serverNow - data.startTime) / 1000)
      const time = currentTime - timeElapsed

      setTimeLeft(time)

      if (time === 3) {
        setTimerColor(Theme.colors.red)
        startFastPulse()
      }

      if (time <= 3) {
        vibrationEnabled && Vibration.vibrate(50)
      }

      if (time <= 0) {
        stopTimer(data)
        vibrationEnabled && Vibration.vibrate(1000)

        if (data.host === userId) {
          Fire.updateGame("stop", data.gameId, {
            gameStatus: GameStatus.STOPPED,
            playersReady: 1,
          })
        }

        setTimeLeft(0)
        return
      }
    }, 1000)
  }

  const stopCountDown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const stopTimer = async (currentGameData: StopModel) => {
    const userId = getAuth().currentUser?.uid
    if (!userId) return

    await Fire.updatePlayerInputs(
      "stop",
      currentGameData.gameId,
      userId,
      currentInputsRef.current
    )

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setReady(false)
  }

  const handleSumPoints = (toAdd: number) => {
    if (mode === "offline") {
      setPoints(points + toAdd)
    }

    if (!gameData) return
    const userId = getAuth().currentUser?.uid
    if (!userId) return

    setPoints(points + toAdd)

    const updatedPlayers = gameData.players.map((player) => {
      if (player.id === userId) {
        return {
          ...player,
          points: player.points + toAdd,
        }
      }
      return player
    })

    Fire.updateGame("stop", gameData.gameId, {
      players: updatedPlayers,
    })
  }

  const handleBackPress = (data?: StopModel | null): boolean => {
    const currentData = data ?? gameData

    if (mode === "offline") handleOnExit()
    if (!currentData) return true
    if (currentData.gameStatus === GameStatus.IN_PROGRESS) {
      vibrationEnabled && Vibration.vibrate(100)
      return true
    }

    if (currentData.players.length <= 1) {
      handleOnExit()
      return true
    }

    mode === "online" && setCloseModalVisible(true)
    mode === "join" && setCloseModalVisible(true)
    return true
  }

  const handleRestartInputs = () => {
    setRestartModalVisible(false)
    setInputs({
      name: "",
      country: "",
      animal: "",
      food: "",
      object: "",
      lastName: "",
      color: "",
      artist: "",
      fruit: "",
      profession: "",
    })
  }

  const copyRoomCode = () => {
    vibrationEnabled && Vibration.vibrate(10)
    Clipboard.setString(gameData?.gameId ?? "")
    ToastAndroid.showWithGravity(
      t("copied_clipboard"),
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    )
  }

  const handleOnExit = () => {
    setCloseModalVisible(false)

    if (backHandlerRef.current) {
      backHandlerRef.current.remove()
      backHandlerRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    navigation.goBack()
  }

  const handlePlayers = () => {
    if (mode === "offline") return
    if (!connection) return
    if (gameData?.gameStatus === GameStatus.IN_PROGRESS) return

    sheetRef.current?.expand()
  }

  const startFastPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const handlePlayerInputsModal = (player: Player) => {
    if (mode === "offline") return
    if (!connection) return
    if (gameData?.gameStatus === GameStatus.IN_PROGRESS) return
    if (gameData?.gameStatus === GameStatus.CREATED) return
    if (player.id === getAuth().currentUser?.uid) return

    setInputsPlayer(player)
    setInputsModalVisible(true)
  }

  if (!loaded && connection) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTintColor: Theme.colors.text,
            headerTitle: "",
            headerTitleStyle: {
              fontSize: Theme.sizes.h0,
              fontFamily: Theme.fonts.onestBold,
            },
            headerTitleAlign: "center",
            headerLeft: () => <></>,
            headerRight: () => <></>,
          }}
        />
        <Loading />
      </>
    )
  }

  return (
    <Screen>
      {!connection && mode !== "offline" && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: Theme.colors.backdrop,
            zIndex: 10,
            gap: 16,
          }}
        >
          <OfflineIcon size={64} color={Theme.colors.accent} />

          <Text
            style={{
              color: Theme.colors.accent,
              fontFamily: Theme.fonts.onestBold,
              fontSize: Theme.sizes.h0,
            }}
          >
            {t("you_are_offline")}
          </Text>

          <ActivityIndicator
            size="large"
            color={Theme.colors.accent}
            style={{ width: 38, height: 38, alignSelf: "center" }}
          />
        </View>
      )}

      <Stack.Screen
        options={{
          headerTintColor: Theme.colors.text,
          headerTitle: title ?? "Stop Trivia",
          headerTitleStyle: {
            fontSize: Theme.sizes.h0,
            fontFamily: Theme.fonts.onestBold,
          },
          headerTitleAlign: "center",
          headerLeft: () => (
            <BackIcon size={34} onPress={() => handleBackPress(gameData)} />
          ),
          headerRight: () => (
            <CurrentPlayers
              onPress={handlePlayers}
              players={gameData?.players.length}
            />
          ),
        }}
      />

      <CustomModal
        title={t("restart_inputs")}
        description={t("restart_inputs_desc")}
        modalVisible={restartModalVisible}
        onRequestClose={() => {
          setRestartModalVisible(!restartModalVisible)
        }}
        onAccept={handleRestartInputs}
      />

      <CustomModal
        title={t("close_room")}
        description={
          mode !== "join" ? t("close_room_desc") : t("close_room_join_desc")
        }
        modalVisible={closeModalVisible}
        onRequestClose={() => {
          setCloseModalVisible(!closeModalVisible)
        }}
        onAccept={handleOnExit}
      />

      <PlayerInputsInfoModal
        modalVisible={inputsModalVisible}
        onRequestClose={() => setInputsModalVisible(false)}
        player={inputsPlayer}
      />

      <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1, width: "100%" }}>
          {mode !== "offline" && (
            <View
              style={{
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                paddingVertical: 24,
              }}
            >
              <Animated.Text
                style={{
                  color: timerColor,
                  fontFamily: Theme.fonts.onest,
                  fontSize: Theme.sizes.h3,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                {t("time_left")}: {formatTime(timeLeft)}
              </Animated.Text>
            </View>
          )}

          <View style={{ flex: 1, flexDirection: "row", gap: 18 }}>
            <View style={styles.columns}>
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, name: text })}
                value={inputs.name}
                placeholder={t("name")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, country: text })}
                value={inputs.country}
                placeholder={t("country")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, animal: text })}
                value={inputs.animal}
                placeholder={t("animal")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, food: text })}
                value={inputs.food}
                placeholder={t("food")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, object: text })}
                value={inputs.object}
                placeholder={t("object")}
              />
            </View>

            <View style={styles.columns}>
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, lastName: text })}
                value={inputs.lastName}
                placeholder={t("last_name")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, color: text })}
                value={inputs.color}
                placeholder={t("color")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, artist: text })}
                value={inputs.artist}
                placeholder={t("artist")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, fruit: text })}
                value={inputs.fruit}
                placeholder={t("fruit")}
              />
              <FocusInput
                editable={
                  mode === "offline"
                    ? true
                    : gameData?.gameStatus === GameStatus.IN_PROGRESS &&
                      !isStarting
                }
                onChange={(text) => setInputs({ ...inputs, profession: text })}
                value={inputs.profession}
                placeholder={t("profession")}
              />
            </View>
          </View>

          {gameData?.gameStatus !== GameStatus.STOPPED && mode !== "offline" ? (
            <View
              style={{
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                paddingVertical: 24,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text,
                  fontFamily: Theme.fonts.onestBold,
                  fontSize: 96,
                }}
              >
                {countdown}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {gameData?.players.length === 4 ||
                (mode === "offline" && (
                  <Pressable
                    onPress={() => handleSumPoints(25)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed
                          ? Theme.colors.background2
                          : Theme.colors.primary2,
                      },
                      styles.buttons,
                    ]}
                  >
                    <Text style={styles.texts}>25</Text>
                  </Pressable>
                ))}

              <Pressable
                onPress={() => handleSumPoints(50)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? Theme.colors.background2
                      : Theme.colors.primary2,
                  },
                  styles.buttons,
                ]}
              >
                <Text style={styles.texts}>50</Text>
              </Pressable>

              {gameData?.players.length === 3 ||
                (mode === "offline" && (
                  <Pressable
                    onPress={() => handleSumPoints(75)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed
                          ? Theme.colors.background2
                          : Theme.colors.primary2,
                      },
                      styles.buttons,
                    ]}
                  >
                    <Text style={styles.texts}>75</Text>
                  </Pressable>
                ))}

              <Pressable
                onPress={() => handleSumPoints(100)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? Theme.colors.background2
                      : Theme.colors.primary2,
                  },
                  styles.buttons,
                ]}
              >
                <Text style={styles.texts}>100</Text>
              </Pressable>
            </View>
          )}

          <View
            style={{ flexDirection: "column", gap: 12, paddingVertical: 24 }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={styles.texts}>
                {t("round")}:{" "}
                {gameData?.round === 0 ? 1 : (gameData?.round ?? 0)}
              </Text>
              <Text style={styles.texts}>
                {t("letter")}: {letter}
              </Text>
              <Text style={styles.texts}>
                {t("your_points")}: {points}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {gameData?.gameStatus !== GameStatus.IN_PROGRESS && (
                <>
                  {mode === "online" && (
                    <PlayingButton
                      flag="play"
                      onPress={() => handlePress("play")}
                      icon={<PlayIcon size={30} />}
                    />
                  )}

                  {mode === "join" && !ready && (
                    <PlayingButton
                      flag="ready"
                      onPress={() => handlePress("ready")}
                      icon={<CheckIcon size={30} />}
                    />
                  )}
                </>
              )}

              {gameData?.gameStatus === GameStatus.IN_PROGRESS && (
                <PlayingButton
                  flag="stop"
                  onPress={() => handlePress("stop")}
                  icon={
                    <Image
                      source={require("@/assets/icons/ic_brand.png")}
                      style={{ width: 30, height: 30 }}
                    />
                  }
                />
              )}

              {gameData?.gameStatus !== GameStatus.IN_PROGRESS && (
                <PlayingButton
                  flag="restart"
                  onPress={() => handlePress("restart")}
                  icon={<RestartIcon size={30} />}
                />
              )}
            </View>
          </View>
        </View>
      </Pressable>

      <BottomSheetModal title={t("players")} ref={sheetRef}>
        <View style={{ marginBottom: 8, gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: Theme.colors.accent,
                fontFamily: Theme.fonts.onest,
                fontSize: Theme.sizes.h4,
              }}
            >
              {gameData?.gameId.toUpperCase()}
            </Text>

            <Pressable onPress={copyRoomCode}>
              <CopyIcon color={Theme.colors.accent} size={16} />
            </Pressable>
          </View>

          {gameData &&
            gameData.players
              .sort((a, b) => b.points - a.points)
              .map((player) => (
                <Pressable
                  key={player.id}
                  onPress={() => handlePlayerInputsModal(player)}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.6 : 1,
                      backgroundColor: Theme.colors.background2,
                      padding: 16,
                      borderRadius: 14,
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 8,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: Theme.colors.primary2,
                      borderRadius: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {!player.photoURL || player.photoURL === "" ? (
                      <UserIcon size={32} color={Theme.colors.accent} />
                    ) : (
                      <Image
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                        source={{ uri: player.photoURL }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: Theme.colors.gray,
                      fontFamily: Theme.fonts.onestBold,
                      fontSize: Theme.sizes.h3,
                      textAlign: "left",
                    }}
                  >
                    {player.name}
                  </Text>
                  <Text
                    style={{
                      color: Theme.colors.gray,
                      fontFamily: Theme.fonts.onest,
                      fontSize: Theme.sizes.h3,
                    }}
                  >
                    {player.points}
                  </Text>
                </Pressable>
              ))}
        </View>
      </BottomSheetModal>
    </Screen>
  )
}

const CurrentPlayers = ({
  players = 1,
  onPress,
}: {
  players?: number
  onPress: () => void
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <UsersIcon color={Theme.colors.accent} />
      <Text
        style={{
          color: Theme.colors.accent,
          fontFamily: Theme.fonts.onestBold,
        }}
      >
        {players}/4
      </Text>
    </Pressable>
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
  },
  modalBottomButtons: {
    padding: 12,
    borderRadius: 16,
  },
})
