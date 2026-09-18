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
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
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
import { Badge } from "@/components/ui/Badge"
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
import { StopPlayer } from "@/interfaces/Player"
import { PlayerInputsInfoModal } from "@/components/PlayerInputsInfoModal"
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads"
import { Loading } from "@/components/Loading"
import { LinearGradient } from "expo-linear-gradient"
import { adInterstitialId } from "@/db/firebaseConfig"

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : adInterstitialId

const leftColumn = [
  { key: "name", label: "name" },
  { key: "country", label: "country" },
  { key: "animal", label: "animal" },
  { key: "food", label: "food" },
  { key: "object", label: "object" },
] as const

const rightColumn = [
  { key: "lastName", label: "last_name" },
  { key: "color", label: "color" },
  { key: "artist", label: "artist" },
  { key: "fruit", label: "fruit" },
  { key: "profession", label: "profession" },
] as const

export default function Stop() {
  const [gameData, setGameData] = useState<StopModel | null>(null)
  const [points, setPoints] = useState<number>(0)
  const [title, setTitle] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | string>(3)
  const [timeLeft, setTimeLeft] = useState<number>(300)
  const [closeModalVisible, setCloseModalVisible] = useState<boolean>(false)
  const [restartModalVisible, setRestartModalVisible] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false)
  const [isStarting, setIsStarting] = useState(false)
  const [connection, setConnection] = useState<boolean>(true)
  const [timerColor, setTimerColor] = useState(Theme.colors.gray)
  const [inputsPlayer, setInputsPlayer] = useState<StopPlayer | null>(null)
  const [inputsModalVisible, setInputsModalVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [idModalVisible, setIdModalVisible] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
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
  const playersCount = useRef<number>(1)
  const vibrationEnabled = useRef<boolean>(undefined)

  const navigation = useNavigation()
  const { getItem } = useStorage()
  const { t } = useTranslation()
  const { mode, id, time } = useLocalSearchParams<{
    mode: string
    id: string
    time: string
  }>()

  const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    keywords: [
      "games",
      "gaming",
      "multiplayer",
      "action",
      "android",
      "technology",
      "software",
      "mobile development",
    ],
  })

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const vibrationValue = await getItem("vibration")
        vibrationEnabled.current = parseBoolean(vibrationValue)
      }

      const backPress = () => handleBackPress()
      backHandlerRef.current = BackHandler.addEventListener(
        "hardwareBackPress",
        backPress,
      )

      loadSettings()

      return () => {
        if (backHandlerRef.current) {
          backHandlerRef.current.remove()
          backHandlerRef.current = null
        }
      }
    }, [gameData, mode, vibrationEnabled.current]),
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

    connectionUnsubscribe = NetInfo.addEventListener((state) => {
      setConnection(state.isConnected ?? false)

      if (!state.isConnected) setLoaded(true)
    })

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true)
        if (Math.floor(Math.random() * 100) >= 50) {
          interstitial.show()
        }
      },
    )

    const unsubscribeOpened = interstitial.addAdEventListener(
      AdEventType.OPENED,
      () => {
        if (Platform.OS === "ios") {
          StatusBar.setHidden(true)
        }
      },
    )

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        if (Platform.OS === "ios") {
          StatusBar.setHidden(false)
        }
      },
    )

    interstitial.load()

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
              ToastAndroid.CENTER,
            )
            navigation.goBack()
            if (timerRef.current) clearInterval(timerRef.current)
          }
          return
        }

        currentGameData = data as StopModel
        setGameData(currentGameData)
        setTitleByGameStatus(connection ? currentGameData.gameStatus : 3)

        playersCount.current = currentGameData.players.length
        if (playersCount.current > 1) {
          setIdModalVisible(false)
        }

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

    return () => {
      if (connectionUnsubscribe) {
        connectionUnsubscribe()
        connectionUnsubscribe = undefined
      }

      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
      }

      unsubscribeLoaded()
      unsubscribeOpened()
      unsubscribeClosed()

      if (timerRef.current) clearInterval(timerRef.current)

      if (mode === "online" && gameId) {
        Fire.deleteGame("stop", gameId)
      }

      if (mode === "join" && gameId && currentGameData) {
        Fire.updateGame("stop", gameId, {
          players: currentGameData
            ? currentGameData.players.filter(
                (player) => player.id !== getAuth().currentUser?.uid,
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
          vibrationEnabled.current && Vibration.vibrate(100)
          ToastAndroid.showWithGravity(
            t("you_are_alone"),
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          )
          return
        }

        if (gameData.players.length !== gameData.playersReady) {
          vibrationEnabled.current && Vibration.vibrate(100)
          ToastAndroid.showWithGravity(
            t("not_all_players_ready"),
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          )
          return
        }

        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        const randomLetter = letters.charAt(
          Math.floor(Math.random() * letters.length),
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
      Fire.updateGame("stop", gameData.gameId, {
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
        (value) => !value || value.trim() === "",
      )
      if (!allEmpty) {
        setRestartModalVisible(true)
      }
    }
  }

  const handleCountdownSync = async (data: StopModel) => {
    let counter = 3

    vibrationEnabled.current && Vibration.vibrate(30)
    setCountdown(3)
    setIsStarting(true)
    handleRestartInputs()

    Fire.updateGame("stop", data.gameId, {
      round: data.round + 1,
    })

    const offset = await Fire.getServerOffset(data.host)

    timerRef.current = setInterval(() => {
      vibrationEnabled.current && Vibration.vibrate(30)
      counter--
      setCountdown(counter)

      if (counter === 0) {
        stopCountDown()
        handleTimer(data, offset)
        setCountdown(data.currentLetter)
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

      if (time > 0 && time <= 3) {
        vibrationEnabled.current && Vibration.vibrate(50)
      }

      if (time <= 0) {
        stopTimer(data)
        vibrationEnabled.current && Vibration.vibrate(1000)

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
      currentInputsRef.current,
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

    Fire.updatePlayerPoints("stop", gameData.gameId, userId, toAdd)

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
      vibrationEnabled.current && Vibration.vibrate(100)
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
    vibrationEnabled.current && Vibration.vibrate(10)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 4000)

    Clipboard.setString(gameData?.gameId ?? "")
    ToastAndroid.showWithGravity(
      t("copied_clipboard"),
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
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
      ]),
    ).start()
  }

  const handlePlayerInputsModal = (player: StopPlayer) => {
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

  const isInProgress = gameData?.gameStatus === GameStatus.IN_PROGRESS

  return (
    <Screen>
      {!connection && mode !== "offline" && (
        <View style={styles.offlineOverlay}>
          <View style={styles.offlineCard}>
            <OfflineIcon size={56} color={Theme.colors.primarySoft} />
            <Text style={styles.offlineTitle}>{t("you_are_offline")}</Text>
            <ActivityIndicator size="large" color={Theme.colors.primarySoft} />
          </View>
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
            <Pressable
              onPress={() => handleBackPress(gameData)}
              style={({ pressed }) => [
                styles.headerBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <BackIcon size={22} color={Theme.colors.primarySoft} />
            </Pressable>
          ),
          headerRight: () =>
            mode !== "offline" && (
              <CurrentPlayers
                onPress={handlePlayers}
                players={gameData?.players.length}
              />
            ),
        }}
      />

      {mode !== "offline" && (
        <Modal
          animationType="fade"
          transparent
          visible={idModalVisible}
          onRequestClose={() => {
            setIdModalVisible(false)
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              setIdModalVisible(false)
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
                  <Badge variant="accent">Invite</Badge>
                  <Text style={styles.modalTitle}>{t("invite_friends")}</Text>

                  <View style={styles.roomCodeWrap}>
                    <Text style={styles.roomCode}>
                      {gameData?.gameId.toUpperCase()}
                    </Text>
                    <Pressable onPress={copyRoomCode} hitSlop={10}>
                      {copied ? (
                        <CheckIcon color={Theme.colors.green} size={24} />
                      ) : (
                        <CopyIcon color={Theme.colors.primarySoft} size={24} />
                      )}
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </LinearGradient>
          </TouchableWithoutFeedback>
        </Modal>
      )}

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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, width: "100%" }}>
            {mode !== "offline" && (
              <View style={styles.timerRow}>
                <View style={styles.timerPill}>
                  <Animated.Text
                    style={[
                      styles.timerText,
                      { color: timerColor, transform: [{ scale: scaleAnim }] },
                    ]}
                  >
                    {formatTime(timeLeft)}
                  </Animated.Text>
                  <Text style={styles.timerCaption}>{t("time_left")}</Text>
                </View>
              </View>
            )}

            {isInProgress ? (
              <View style={styles.heroRow}>
                <LinearGradient
                  colors={
                    isStarting || typeof countdown === "number"
                      ? Theme.gradients.cardHigh
                      : Theme.gradients.primaryDeep
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.letterBadge}
                >
                  <Text style={styles.heroChar}>{countdown}</Text>
                </LinearGradient>
                {!isStarting && (
                  <Text style={styles.heroHint}>{t("fill_spaces")}</Text>
                )}
              </View>
            ) : (
              gameData?.gameStatus === GameStatus.STOPPED && (
                <View style={styles.pointsRow}>
                  {(gameData?.players.length === 4 || mode === "offline") && (
                    <ScoreChip value={25} onPress={handleSumPoints} />
                  )}

                  <ScoreChip value={50} onPress={handleSumPoints} />

                  {(gameData?.players.length === 3 || mode === "offline") && (
                    <ScoreChip value={75} onPress={handleSumPoints} />
                  )}

                  <ScoreChip value={100} onPress={handleSumPoints} />
                </View>
              )
            )}

            <View style={styles.boardWrap}>
              <View style={styles.columns}>
                <View style={styles.column}>
                  {leftColumn.map((field) => (
                    <FocusInput
                      key={field.key}
                      editable={
                        mode === "offline" ? true : isInProgress && !isStarting
                      }
                      onChange={(text) =>
                        setInputs({ ...inputs, [field.key]: text })
                      }
                      value={inputs[field.key]}
                      placeholder={t(field.label)}
                    />
                  ))}
                </View>

                <View style={styles.column}>
                  {rightColumn.map((field) => (
                    <FocusInput
                      key={field.key}
                      editable={
                        mode === "offline" ? true : isInProgress && !isStarting
                      }
                      onChange={(text) =>
                        setInputs({ ...inputs, [field.key]: text })
                      }
                      value={inputs[field.key]}
                      placeholder={t(field.label)}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              {mode !== "offline" && (
                <StatChip
                  label={t("round")}
                  value={`${gameData?.round === 0 ? 1 : (gameData?.round ?? 0)}`}
                />
              )}
              <StatChip label={t("your_points")} value={`${points}`} />
            </View>

            <View style={styles.actionsRow}>
              {gameData?.gameStatus !== GameStatus.IN_PROGRESS && (
                <>
                  {mode === "online" && (
                    <ActionButton
                      flag="play"
                      label={t("play")}
                      onPress={() => handlePress("play")}
                      icon={<PlayIcon size={26} color={Theme.colors.text} />}
                    />
                  )}

                  {mode === "join" && !ready && (
                    <ActionButton
                      flag="ready"
                      label="Ready"
                      onPress={() => handlePress("ready")}
                      icon={<CheckIcon size={24} color={Theme.colors.text} />}
                    />
                  )}
                </>
              )}

              {isInProgress && (
                <ActionButton
                  flag="stop"
                  label="STOP"
                  onPress={() => handlePress("stop")}
                  icon={
                    <Image
                      source={require("@/assets/icons/ic_brand.png")}
                      style={{ width: 26, height: 26 }}
                    />
                  }
                />
              )}

              {gameData?.gameStatus !== GameStatus.IN_PROGRESS && (
                <ActionButton
                  flag="restart"
                  label="Restart"
                  onPress={() => handlePress("restart")}
                  icon={
                    <RestartIcon size={24} color={Theme.colors.secondary} />
                  }
                />
              )}
            </View>
          </View>
        </ScrollView>
      </Pressable>

      <BottomSheetModal
        title={t("players")}
        ref={sheetRef}
        icon={<UsersIcon size={20} color={Theme.colors.primarySoft} />}
      >
        <View style={{ marginBottom: 8, gap: Theme.spacing.s }}>
          <View style={styles.roomRow}>
            <Text style={styles.roomRowCode}>
              {gameData?.gameId.toUpperCase()}
            </Text>
            <Pressable onPress={copyRoomCode} hitSlop={10}>
              {copied ? (
                <CheckIcon color={Theme.colors.green} size={18} />
              ) : (
                <CopyIcon color={Theme.colors.primarySoft} size={18} />
              )}
            </Pressable>
          </View>

          {gameData &&
            gameData.players
              .sort((a, b) => b.points - a.points)
              .map((player, index) => (
                <Pressable
                  key={player.id}
                  onPress={() => handlePlayerInputsModal(player)}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.75 : 1,
                      backgroundColor: Theme.colors.surfaceHigh,
                      padding: Theme.spacing.m,
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
                  <View style={styles.avatar}>
                    {!player.photoURL || player.photoURL === "" ? (
                      <UserIcon size={24} color={Theme.colors.primarySoft} />
                    ) : (
                      <Image
                        style={styles.avatarImage}
                        source={{ uri: player.photoURL }}
                      />
                    )}
                  </View>

                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>

                  <View
                    style={[
                      styles.playerPoints,
                      index === 0 && styles.leaderPoints,
                    ]}
                  >
                    <Text
                      style={[
                        styles.playerPointsText,
                        index === 0 && styles.leaderPointsText,
                      ]}
                    >
                      {player.points}
                    </Text>
                  </View>
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
      hitSlop={8}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          flexDirection: "row",
          gap: Theme.spacing.s,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Theme.colors.surface,
          borderWidth: 1,
          borderColor: Theme.colors.borderSoft,
          paddingHorizontal: Theme.spacing.m,
          paddingVertical: 6,
          borderRadius: Theme.radii.pill,
        },
      ]}
    >
      <UsersIcon size={16} color={Theme.colors.primarySoft} />
      <Text
        style={{
          color: Theme.colors.primarySoft,
          fontFamily: Theme.fonts.onestBold,
          fontSize: Theme.sizes.h5,
        }}
      >
        {players}/4
      </Text>
    </Pressable>
  )
}

const ScoreChip = ({
  value,
  onPress,
}: {
  value: number
  onPress: (value: number) => void
}) => {
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        styles.scoreChip,
      ]}
    >
      <Text style={styles.scoreChipSign}>+</Text>
      <Text style={styles.scoreChipValue}>{value}</Text>
    </Pressable>
  )
}

const StatChip = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const ActionButton = ({
  flag,
  label,
  onPress,
  icon,
}: {
  flag: string
  label: string
  onPress: (flag: string) => void
  icon: React.ReactNode
}) => {
  return (
    <View style={styles.actionWrap}>
      <PlayingButton flag={flag} onPress={onPress} icon={icon} />
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  offlineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.backdrop,
    zIndex: 10,
    padding: Theme.spacing.xl,
  },
  offlineCard: {
    alignItems: "center",
    gap: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.xxxl,
    width: "100%",
    maxWidth: 420,
    ...Theme.shadows.lg,
  },
  offlineTitle: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h0,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    gap: Theme.spacing.l,
    ...Theme.shadows.lg,
  },
  modalTitle: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  roomCodeWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.lg,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
    minWidth: 180,
  },
  roomCode: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
    letterSpacing: 4,
  },
  timerRow: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Theme.spacing.l,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.xl,
    ...Theme.shadows.md,
  },
  timerText: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
    fontVariant: ["tabular-nums"],
  },
  timerCaption: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroRow: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: Theme.spacing.m,
    paddingVertical: Theme.spacing.l,
  },
  letterBadge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.glow,
  },
  heroChar: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: 72,
  },
  heroHint: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
  },
  pointsRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: Theme.spacing.m,
    paddingVertical: Theme.spacing.m,
  },
  pointsScoreTitle: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  boardWrap: {
    gap: Theme.spacing.m,
  },
  boardHeader: {
    alignItems: "center",
  },
  columns: {
    flexDirection: "row",
    gap: Theme.spacing.m,
  },
  column: {
    flex: 1,
    flexDirection: "column",
    gap: Theme.spacing.m,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    gap: Theme.spacing.m,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingVertical: Theme.spacing.xl,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.s,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.l,
    minWidth: 96,
    justifyContent: "center",
  },
  statValue: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Theme.spacing.l,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingBottom: Theme.spacing.xxl,
  },
  actionWrap: {
    alignItems: "center",
    gap: Theme.spacing.s,
  },
  actionLabel: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scoreChip: {
    minWidth: 72,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.radii.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: Theme.spacing.xs,
    ...Theme.shadows.sm,
  },
  scoreChipSign: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  scoreChipValue: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  roomRow: {
    flexDirection: "row",
    gap: Theme.spacing.s,
    alignItems: "center",
    justifyContent: "center",
  },
  roomRowCode: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
    letterSpacing: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playerName: {
    flex: 1,
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
    textAlign: "left",
  },
  playerPoints: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: 4,
  },
  leaderPoints: {
    backgroundColor: Theme.colors.primary2,
    borderColor: Theme.colors.primarySoft,
  },
  playerPointsText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
    fontVariant: ["tabular-nums"],
  },
  leaderPointsText: {
    color: Theme.colors.primarySoft,
  },
})
