import { CustomModal } from "@/components/CustomModal"
import {
  BackIcon,
  CheckIcon,
  CopyIcon,
  OfflineIcon,
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
  Modal,
  TouchableWithoutFeedback,
} from "react-native"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import Clipboard from "@react-native-clipboard/clipboard"
import { Screen } from "@/components/ui/Screen"
import { PlayingButton } from "@/components/PlayingButton"
import { LinearGradient } from "expo-linear-gradient"
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
const POS = { X: "X", O: "O" }

export default function TTT() {
  const [gameData, setGameData] = useState<TTTModel | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [closeModalVisible, setCloseModalVisible] = useState<boolean>(false)
  const [connection, setConnection] = useState<boolean>(true)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [winnerText, setWinnerText] = useState<string | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [board, setBoard] = useState(initialBoard)
  const [loaded, setLoaded] = useState(false)
  const [pointsAdded, setPointsAdded] = useState<boolean>(false)
  const [idModalVisible, setIdModalVisible] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
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
  const myId = useRef<string | null>(null)
  const roomId = useRef<string | null>(null)
  const backHandlerRef = useRef<NativeEventSubscription | null>(null)
  const playersCount = useRef<number>(1)
  const vibrationEnabled = useRef<boolean>(undefined)

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
        backPress
      )

      loadSettings()

      return () => {
        if (backHandlerRef.current) {
          backHandlerRef.current.remove()
          backHandlerRef.current = null
        }
      }
    }, [])
  )

  useEffect(() => {
    // Check the winner
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

        if (mode === "offline") {
          setWinnerText(`${board[a]} ${t("win")}`)
        } else {
          board[a] === myId.current && setWinnerText(t("you_win"))
          board[a] !== myId.current && setWinnerText(t("you_loose"))

          if (mode === "online") {
            Fire.updateGame("ttt", roomId.current!, {
              gameStatus: GameStatus.STOPPED,
            })
          }

          if (!pointsAdded) sumWins()
        }

        return
      }
    }

    if (board.every((square) => square)) {
      setWinner("draw")
      setWinnerText(t("draw"))
    }
  }, [board])

  useEffect(() => {
    let gameId = id
    let unsubscribe: (() => void) | undefined
    let connectionUnsubscribe: (() => void) | undefined
    let backHandler: NativeEventSubscription
    let currentGameData: TTTModel

    connectionUnsubscribe = NetInfo.addEventListener((state) => {
      setConnection(state.isConnected ?? false)

      if (!state.isConnected) setLoaded(true)
    })

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

    if (mode === "online") {
      gameId = sixDigit()
      Fire.setGame("ttt", gameId, {
        gameId,
        round: 1,
        currentPlayer: getRandomXO(),
        gameStatus: GameStatus.CREATED,
        players: [
          {
            id: getAuth().currentUser?.uid,
            name: getAuth().currentUser?.displayName,
            pos: getRandomXO(),
            wins: 0,
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
                photoURL: getAuth().currentUser?.photoURL!,
                wins: 0,
              },
            ],
          })
        }
      })
    }

    if (mode === "offline" || mode === "computer") {
      myId.current = POS.X
      const backPress = (): boolean => {
        return handleBackPress(currentGameData)
      }

      backHandler = BackHandler.addEventListener("hardwareBackPress", backPress)

      return
    }

    if (mode !== "offline" && mode !== "computer") {
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
        roomId.current = currentGameData.gameId
        setGameData(currentGameData)
        setBoard(currentGameData.filledPos)
        setIsPlayerTurn(currentGameData?.currentPlayer === POS.X)
        setTitleByGameStatus(connection ? currentGameData.gameStatus : 3)

        playersCount.current = currentGameData.players.length
        if (playersCount.current > 1) {
          setIdModalVisible(false)
        }

        if (currentGameData.gameStatus === GameStatus.CREATED) {
          setWinnerText(null)
          setWinner(null)
          pointsAdded && setPointsAdded(false)

          if (mode === "online" && !myId.current) {
            currentGameData.players.forEach((p) => {
              if (getAuth().currentUser?.uid === p.id) {
                myId.current = p.pos
              }
            })
          }

          if (mode === "join" && !myId.current) {
            currentGameData.players.forEach((p) => {
              if (p.id === currentGameData.host) {
                myId.current = p.pos === POS.X ? POS.O : POS.X
              }
            })
          }
        }

        const backPress = (): boolean => {
          return handleBackPress(currentGameData)
        }

        backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          backPress
        )
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
      }

      if (connectionUnsubscribe) {
        connectionUnsubscribe()
        connectionUnsubscribe = undefined
      }

      unsubscribeLoaded()
      unsubscribeOpened()
      unsubscribeClosed()

      roomId.current = null

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
    const values = [POS.X, POS.O]
    const randomIndex = Math.floor(Math.random() * values.length)
    return values[randomIndex]
  }

  const setTitleByGameStatus = (gameStatus: number | undefined) => {
    switch (gameStatus) {
      case GameStatus.CREATED:
        setTitle("Tic Tac Toe")
        break
      case GameStatus.IN_PROGRESS:
        setTitle("Tic Tac Toe")
        break
      case GameStatus.STOPPED:
        setTitle("STOP!")
        break
      case 3:
        setTitle(t("connection_lost"))
        break
    }
  }

  const handleBackPress = (data?: TTTModel | null): boolean => {
    const currentData = data ?? gameData

    if (mode === "offline" || mode === "computer") handleOnExit()
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

  const handleSquarePress = (index: number) => {
    if (winner) return

    if (mode === "offline" && !board[index]) {
      const newBoard = [...board]
      newBoard[index] = isPlayerTurn ? POS.X : POS.O
      setBoard(newBoard)
      setIsPlayerTurn(!isPlayerTurn)
    }

    if (mode !== "offline" && !board[index]) {
      if (gameData?.currentPlayer !== myId.current) {
        vibrationEnabled.current && Vibration.vibrate(100)
        ToastAndroid.showWithGravity(
          t("not_your_turn"),
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        )
        return
      }

      const newBoard = [...board]
      newBoard[index] = gameData?.currentPlayer
      setBoard(newBoard)

      Fire.updateGame("ttt", gameData.gameId, {
        currentPlayer: gameData?.currentPlayer === POS.X ? POS.O : POS.X,
        filledPos: newBoard,
      })
    }
  }

  const handleReset = () => {
    if (mode === "offline") setIsPlayerTurn(true)
    setBoard(initialBoard)
    setWinner(null)
    setWinnerText(null)

    if (mode === "offline") return
    if (!gameData) return

    Fire.updateGame("ttt", roomId.current!, {
      currentPlayer: getRandomXO(),
      filledPos: initialBoard,
      gameStatus: GameStatus.CREATED,
      round: gameData.round + 1,
    })
  }

  const handleOnExit = () => {
    setCloseModalVisible(false)

    if (backHandlerRef.current) {
      backHandlerRef.current.remove()
      backHandlerRef.current = null
    }

    navigation.goBack()
  }

  const handlePlayers = () => {
    if (mode === "offline" || mode === "computer") return
    if (!connection) return
    if (gameData?.gameStatus === GameStatus.IN_PROGRESS) return

    sheetRef.current?.expand()
  }

  const sumWins = () => {
    if (!gameData) return
    if (!getAuth().currentUser?.uid) return
    if (winner !== myId.current) return

    const userId = getAuth().currentUser?.uid

    const updatedPlayers = gameData.players.map((p) => {
      if (p.id === userId) {
        return {
          ...p,
          wins: p.wins + 1,
        }
      }
      return p
    })

    Fire.updateGame("ttt", gameData.gameId, {
      players: updatedPlayers,
    })

    setPointsAdded(true)
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
          headerTitle: title ?? "Tic Tac Toe",
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

      <View style={styles.turnRow}>
        <View style={styles.turnPill}>
          <View
            style={[
              styles.turnDot,
              {
                backgroundColor: isPlayerTurn
                  ? Theme.colors.primarySoft
                  : Theme.colors.secondary,
              },
            ]}
          />
          <Text style={styles.turnText}>
            {t("turn")}:{" "}
            <Text
              style={{
                fontFamily: Theme.fonts.onestBold,
                color: isPlayerTurn
                  ? Theme.colors.primarySoft
                  : Theme.colors.secondary,
              }}
            >
              {isPlayerTurn ? POS.X : POS.O}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.boardRow}>
        <View style={styles.boardPanel}>
          {board.map((data, index) => (
            <Animated.View
              key={index}
              style={[
                styles.square,
                {
                  width: "30%",
                  transform: [{ scale: btnScales[index] }],
                  backgroundColor: data
                    ? Theme.colors.surfaceHigh
                    : Theme.colors.surface,
                },
              ]}
            >
              <Pressable
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                onPress={() => handleSquarePress(index)}
                style={styles.squarePressable}
              >
                <LinearGradient
                  colors={
                    data
                      ? Theme.gradients.cardHigh
                      : [Theme.colors.surface, Theme.colors.surfaceHigh] as const
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.squareGradient}
                >
                  <Text
                    style={[
                      styles.squareText,
                      {
                        color:
                          data === POS.X
                            ? Theme.colors.primarySoft
                            : Theme.colors.secondary,
                      },
                    ]}
                  >
                    {data}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.winnerRow}>
        {winnerText && !winner ? (
          <Text style={styles.winnerText}>{winnerText}</Text>
        ) : (
          <Text style={[styles.winnerText, styles.winnerTextGlow]}>
            {winnerText}
          </Text>
        )}
      </View>

      <View style={styles.bottomRow}>
        {mode !== "offline" && (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {gameData?.round === 0 ? 1 : (gameData?.round ?? 0)}
              </Text>
              <Text style={styles.statLabel}>{t("round")}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {mode === "offline"
                  ? `${isPlayerTurn ? POS.X : POS.O}`
                  : myId.current}
              </Text>
              <Text style={styles.statLabel}>{t("you")}</Text>
            </View>
          </View>
        )}

        <View style={styles.restartRow}>
          {winner && mode === "online" && (
            <PlayingButton
              flag="restart"
              onPress={() => handleReset()}
              icon={<RestartIcon size={26} color={Theme.colors.secondary} />}
            />
          )}
        </View>
      </View>

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
              .sort((a, b) => b.wins - a.wins)
              .map((player, index) => (
                <Pressable
                  key={player.id}
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
                      <Image style={styles.avatarImage} source={{ uri: player.photoURL }} />
                    )}
                  </View>

                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>

                  <View
                    style={[
                      styles.playerWins,
                      index === 0 && styles.leaderPoints,
                    ]}
                  >
                    <Text
                      style={[
                        styles.playerWinsText,
                        index === 0 && styles.leaderPointsText,
                      ]}
                    >
                      {player.wins}
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
        {players}/2
      </Text>
    </Pressable>
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
  turnRow: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Theme.spacing.l,
  },
  turnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.s,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.xl,
    ...Theme.shadows.sm,
  },
  turnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  turnText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h4,
  },
  boardRow: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.l,
  },
  boardPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 420,
    padding: Theme.spacing.m,
    borderRadius: Theme.radii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.md,
  },
  square: {
    aspectRatio: 1,
    borderRadius: Theme.radii.lg,
    overflow: "hidden",
  },
  squarePressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  squareGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.lg,
  },
  squareText: {
    fontFamily: Theme.fonts.onestBold,
    fontSize: 48,
  },
  winnerRow: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: Theme.spacing.m,
    paddingVertical: Theme.spacing.m,
  },
  winnerText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: 38,
  },
  winnerTextGlow: {
    textShadowColor: Theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  bottomRow: {
    flexDirection: "column",
    gap: Theme.spacing.m,
    paddingVertical: Theme.spacing.l,
  },
  statsRow: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    justifyContent: "center",
    alignItems: "center",
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
    minWidth: 72,
    justifyContent: "center",
  },
  statValue: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  statLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  restartRow: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    justifyContent: "center",
    alignItems: "center",
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
  playerWins: {
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
  playerWinsText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  leaderPointsText: {
    color: Theme.colors.primarySoft,
  },
})