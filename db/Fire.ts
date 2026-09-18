import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from "@react-native-firebase/firestore"
import {
  StopModel,
  GameStatus,
  TTTModel,
  StopReviewSubmission,
} from "@/interfaces/Game"
import { StopPlayer, TTTPlayer } from "@/interfaces/Player"
import { StopGameInputs } from "@/interfaces/StopGameInputs"
import {
  computeStopRoundPoints,
  computeStopRoundPointsWithReviews,
} from "@/libs/scoring"

const db = getFirestore()

class Fire {
  state = {
    stop: {
      gameId: "-1",
      round: 0,
      currentLetter: "-",
      currentTime: 120,
      gameStatus: GameStatus.CREATED,
      playersReady: 1,
      players: [{ id: "", name: "", points: 0, photoURL: "" }] as StopPlayer[],
      host: "no-host",
      startTime: Date.now(),
      timestamp: Date.now(),
    } as StopModel,
    ttt: {
      gameId: "-1",
      round: 0,
      currentPlayer: "X",
      gameStatus: GameStatus.CREATED,
      playersReady: 1,
      players: [{ id: "", name: "", wins: 0, photoURL: "" }] as TTTPlayer[],
      filledPos: ["", "", "", "", "", "", "", "", ""],
      host: "no-host",
      startTime: Date.now(),
      timestamp: Date.now(),
    } as TTTModel,
  }

  setGame = async (
    collectionName: string,
    id: string,
    data: StopModel | TTTModel
  ) => {
    const docRef = doc(db, collectionName, id)
    await setDoc(docRef, data)
  }

  getGame = async (
    collectionName: string,
    id: string
  ): Promise<StopModel | TTTModel | null> => {
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data() as StopModel | TTTModel
    } else {
      return null
    }
  }

  onGameChange(
    collection: string,
    docId: string,
    callback: (data: StopModel | TTTModel | null) => void
  ) {
    const ref = doc(db, collection, docId)
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as StopModel | TTTModel)
      } else {
        callback(null)
      }
    })

    return unsubscribe
  }

  updateGame = async (
    collectionName: string,
    gameId: string,
    data: StopModel | TTTModel | any
  ) => {
    const gameRef = doc(db, collectionName, gameId)
    await updateDoc(gameRef, data)
  }

  updatePlayerInputs = async (
    collection: string,
    gameId: string,
    userId: string,
    inputs: StopGameInputs
  ) => {
    const gameRef = doc(db, collection, gameId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) return
      const data = snap.data() as StopModel
      const players = data?.players.map((p: StopPlayer) =>
        p.id === userId ? { ...p, inputs, inputsRound: data.round } : p
      )
      tx.update(gameRef, { players })
    })
  }

  updatePlayerPoints = async (
    collection: string,
    gameId: string,
    userId: string,
    pointsToAdd: number
  ) => {
    const gameRef = doc(db, collection, gameId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) return
      const data = snap.data()
      const players = data?.players.map((p: StopPlayer) =>
        p.id === userId ? { ...p, points: p.points + pointsToAdd } : p
      )
      tx.update(gameRef, { players })
    })
  }

  deleteGame = async (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
  }

  submitChoice = async (
    gameId: string,
    userId: string,
    sameWords: boolean
  ) => {
    const gameRef = doc(db, "stop", gameId)
    await updateDoc(gameRef, {
      [`scoring.${userId}`]: sameWords,
    })
  }

  clearScoring = async (gameId: string) => {
    const gameRef = doc(db, "stop", gameId)
    await updateDoc(gameRef, { scoring: {} })
  }

  scoreRound = async (gameId: string): Promise<void> => {
    const gameRef = doc(db, "stop", gameId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) return
      const data = snap.data() as StopModel
      const scoreData = data.scoring
      if (!scoreData || data.scoredRound === data.round) return

      const allSubmitted =
        data.players.length > 0 &&
        data.players.every(
          (player) => player.id && scoreData[player.id] !== undefined
        )
      if (!allSubmitted) return

      const pointMap = computeStopRoundPoints(data.players, scoreData)
      const players = data.players.map((player) =>
        player.id
          ? { ...player, points: player.points + (pointMap[player.id] ?? 0) }
          : player
      )

      tx.update(gameRef, {
        players,
        scoredRound: data.round,
        scoring: {},
      })
    })
  }

  submitReview = async (
    gameId: string,
    userId: string,
    review: StopReviewSubmission
  ) => {
    const gameRef = doc(db, "stop", gameId)
    await updateDoc(gameRef, {
      [`reviews.${userId}`]: review,
    })
  }

  clearReviews = async (gameId: string) => {
    const gameRef = doc(db, "stop", gameId)
    await updateDoc(gameRef, { reviews: {}, reviewedRound: null })
  }

  scoreRoundWithReviews = async (gameId: string): Promise<void> => {
    const gameRef = doc(db, "stop", gameId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) return
      const data = snap.data() as StopModel
      const reviewsData = data.reviews
      if (!reviewsData || data.reviewedRound === data.round) return

      const allSubmitted =
        data.players.length > 0 &&
        data.players.every(
          (player) => player.id && reviewsData[player.id]
        )
      if (!allSubmitted) return

      const pointMap = computeStopRoundPointsWithReviews(
        data.players,
        reviewsData
      )
      const players = data.players.map((player) =>
        player.id
          ? { ...player, points: player.points + (pointMap[player.id] ?? 0) }
          : player
      )

      tx.update(gameRef, {
        players,
        reviewedRound: data.round,
        scoring: {},
        reviews: {},
      })
    })
  }

  getServerTimeMs = async (hostId: string): Promise<number> => {
    const ref = doc(db, "serverTime", hostId)
    await setDoc(ref, { now: serverTimestamp() })
    const snap = await getDoc(ref)
    const serverNow = snap.data()?.now?.toDate().getTime()
    return serverNow
  }

  getServerOffset = async (hostId: string): Promise<number> => {
    const ref = doc(db, "serverTime", hostId)
    const t0 = Date.now()
    await setDoc(ref, { now: serverTimestamp() })
    const snap = await getDoc(ref)
    const t1 = Date.now()
    const serverNow = snap.data()?.now?.toDate().getTime()

    const latency = (t1 - t0) / 2
    return serverNow - (t1 - latency)
  }
}

export default new Fire()
