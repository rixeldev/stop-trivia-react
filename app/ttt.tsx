import { CustomModal } from "@/components/CustomModal"
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
import { Theme } from "@/constants/Theme"
import Fire from "@/db/Fire"
import { useStorage } from "@/hooks/useStorage"
import { GameStatus, TTTModel } from "@/interfaces/Game"
import { parseBoolean } from "@/libs/parseBoolean"
import { sixDigit } from "@/libs/randomId"
import BottomSheet from "@gorhom/bottom-sheet"
import { getAuth } from "@react-native-firebase/auth"
import NetInfo from "@react-native-community/netinfo"
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  NativeEventSubscription,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  Vibration,
  View,
} from "react-native"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import Clipboard from "@react-native-clipboard/clipboard"
import { Screen } from "@/components/ui/Screen"
import { PlayingButton } from "@/components/PlayingButton"
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads"
import { Loading } from "@/components/Loading"

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-5333671658707378/4722063158"
const initialBoard = Array(9).fill("")

export default function TTT() {
  const [gameData, setGameData] = useState<TTTModel | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>()
  const [closeModalVisible, setCloseModalVisible] = useState<boolean>(false)
  const [connection, setConnection] = useState<boolean>(true)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [ready, setReady] = useState<boolean>(false)
  const [winnerText, setWinnerText] = useState<string | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [board, setBoard] = useState(initialBoard)
  const [loaded, setLoaded] = useState(false)
  const [btnScales] = useState(() =>
    initialBoard.map(() => new Animated.Value(1))
  )

  const navigation = useNavigation()
  const { getItem } = useStorage()
  const { t } = useTranslation()

  const { mode, id } = useLocalSearchParams<{
    mode: string
    id: string
  }>()

  const sheetRef = useRef<BottomSheet>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handlePressIn = (index: number) => {
    Animated.spring(btnScales[index], {
      toValue: 0.9,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = (index: number) => {
    Animated.spring(btnScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    keywords: ["games", "gaming", "multiplayer", "action", "android"],
  })

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true)
        interstitial.show()
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

  useEffect(() => {
    checkWinner()
  }, [board])

  useEffect(() => {
    let gameId = id
    let unsubscribe: (() => void) | undefined
    let connectionUnsubscribe: (() => void) | undefined
    let backHandler: NativeEventSubscription
    let currentGameData: TTTModel
    console.log(mode, id)

    if (mode === "online") {
      gameId = sixDigit()
      Fire.setGame("ttt", gameId, {
        gameId,
        round: 0,
        currentPlayer: getRandomXO(),
        gameStatus: GameStatus.CREATED,
        playersReady: 1,
        players: [
          {
            id: getAuth().currentUser?.uid,
            name: getAuth().currentUser?.displayName,
            points: 0,
            photoURL: getAuth().currentUser?.photoURL!,
          },
        ],
        filledPos: initialBoard,
        host: getAuth().currentUser?.uid || "no-host",
        startTime: 0,
        timestamp: Date.now(),
      })
    }

    if (mode === "join") {
      Fire.getGame("ttt", gameId).then((data) => {
        if (!data) return
        const userName = getAuth().currentUser?.displayName
        const userId = getAuth().currentUser?.uid
        const alreadyIn = data.players.some((p) => p.id === userId)

        if (!alreadyIn) {
          Fire.updateGame("ttt", gameId, {
            players: [
              ...data.players,
              {
                id: userId,
                name: userName,
                points: 0,
              },
            ],
          })
        }
      })
    }

    if (mode === "offline" || mode === "computer") {
      const backPress = (): boolean => {
        return handleBackPress(currentGameData)
      }

      backHandler = BackHandler.addEventListener("hardwareBackPress", backPress)

      return
    }

    unsubscribe = Fire.onGameChange("ttt", gameId, (data) => {
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

      currentGameData = data as TTTModel
      setGameData(currentGameData)
      setBoard(currentGameData.filledPos)
      setTitleByGameStatus(connection ? currentGameData.gameStatus : 3)

      if (currentGameData.gameStatus === GameStatus.CREATED) {
        setReady(false)
        handleReset()
      }

      if (currentGameData.gameStatus === GameStatus.STOPPED) {
        checkWinner()
      }

      const backPress = (): boolean => {
        return handleBackPress(currentGameData)
      }

      backHandler = BackHandler.addEventListener("hardwareBackPress", backPress)
    })

    connectionUnsubscribe = NetInfo.addEventListener((state) => {
      setConnection(state.isConnected ?? false)
    })

    return () => {
      console.log("Cleaning up...")

      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
      }

      if (connectionUnsubscribe) {
        connectionUnsubscribe()
        connectionUnsubscribe = undefined
      }

      if (timerRef.current) clearInterval(timerRef.current)
      if (backHandler) backHandler.remove()

      if (mode === "online" && gameId) {
        Fire.deleteGame("ttt", gameId)
      }

      if (mode === "join" && gameId && currentGameData) {
        Fire.updateGame("ttt", gameId, {
          players: currentGameData
            ? currentGameData.players.filter(
                (player) => player.id !== getAuth().currentUser?.uid
              )
            : [],
        }).catch(() => null)
      }
    }
  }, [])

  const getRandomXO = (): string => {
    const values = ["X", "O"]
    const randomIndex = Math.floor(Math.random() * values.length)
    return values[randomIndex]
  }

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

  const checkWinner = () => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a])
        setWinnerText(`${board[a]} Win`)
        return
      }
    }

    if (board.every((square) => square)) {
      setWinner("draw")
    }
  }

  const handleBackPress = (data?: TTTModel | null): boolean => {
    const currentData = data ?? gameData

    if (mode === "offline" || mode === "computer") handleOnExit()
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

  const handleSquarePress = (index: number) => {
    if (!board[index] && !winner) {
      const newBoard = [...board]
      newBoard[index] = isPlayerTurn ? "X" : "O"
      setBoard(newBoard)
      setIsPlayerTurn(!isPlayerTurn)
    }
  }

  const handlePress = (flag: string) => {
    if (flag === "restart") {
      handleReset()
    }
  }

  const handleReset = () => {
    if (mode === "offline") setIsPlayerTurn(true)
    setBoard(initialBoard)
    setWinner(null)
    setWinnerText(null)

    if (mode === "offline" || mode === "join") return

    Fire.updateGame("ttt", id, {
      filledPos: initialBoard,
      playersReady:
        gameData && gameData.playersReady > 1 ? gameData.players.length - 1 : 1,
    })
  }

  const handleOnExit = () => {
    setCloseModalVisible(false)
    navigation.goBack()
  }

  const handlePlayers = () => {
    if (mode === "offline" || mode === "computer") return
    if (!connection) return
    if (gameData?.gameStatus === GameStatus.IN_PROGRESS) return

    sheetRef.current?.expand()
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
          headerTitle: title ?? "Tic Tac Toe",
          headerTitleStyle: {
            fontSize: Theme.sizes.h0,
            fontFamily: Theme.fonts.onestBold,
          },
          headerTitleAlign: "center",
          headerLeft: () => (
            <BackIcon size={34} onPress={() => handleBackPress(gameData)} />
          ),
          headerRight:
            mode !== "offline" && mode !== "computer"
              ? () => (
                  <CurrentPlayers
                    onPress={handlePlayers}
                    players={gameData?.players.length}
                  />
                )
              : () => <></>,
        }}
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
            color: Theme.colors.gray,
            fontFamily: Theme.fonts.onest,
            fontSize: Theme.sizes.h3,
          }}
        >
          {isPlayerTurn ? "X" : "O"} Turn
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {board.map((data, index) => (
            <Animated.View
              key={index}
              style={{
                transform: [{ scale: btnScales[index] }],
                width: 100,
                height: 100,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: data
                  ? Theme.colors.background2
                  : Theme.colors.modal,
              }}
            >
              <Pressable
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                onPress={() => handleSquarePress(index)}
                style={{
                  height: "100%",
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    {
                      color:
                        board[index] === "X"
                          ? Theme.colors.accent
                          : Theme.colors.text,
                      fontFamily: Theme.fonts.onestBold,
                      fontSize: 56,
                    },
                  ]}
                >
                  {data}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

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
            fontSize: 56,
          }}
        >
          {winnerText}
        </Text>
      </View>

      <View style={{ flexDirection: "column", gap: 12, paddingVertical: 24 }}>
        {mode !== "offline" && (
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={styles.texts}>
              {t("round")}: {gameData?.round === 0 ? 1 : (gameData?.round ?? 0)}
            </Text>
            <Text style={styles.texts}>
              {t("letter")}: {isPlayerTurn ? "X" : "O"}
            </Text>
          </View>
        )}

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

          {(mode === "offline" || mode === "computer") && (
            <PlayingButton
              flag="restart"
              onPress={() => handlePress("restart")}
              icon={<RestartIcon size={30} />}
            />
          )}
        </View>
      </View>

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
        {players}/2
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  texts: {
    color: Theme.colors.lightGray,
    alignSelf: "flex-start",
    fontFamily: Theme.fonts.onestBold,
  },
})
