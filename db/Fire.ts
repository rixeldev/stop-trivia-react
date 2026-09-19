import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  runTransaction,
  collection,
  query,
  where,
} from "@react-native-firebase/firestore"
import {
  StopModel,
  GameStatus,
  TTTModel,
  StopReviewSubmission,
  GameInviteEntry,
} from "@/interfaces/Game"
import { StopPlayer, TTTPlayer } from "@/interfaces/Player"
import { StopGameInputs } from "@/interfaces/StopGameInputs"
import { FriendEntry, FriendProfile, FriendRequestEntry } from "@/interfaces/User"
import {
  computeStopRoundPoints,
  computeStopRoundPointsWithReviews,
} from "@/libs/scoring"

const db = getFirestore()

const toTime = (value: unknown): number | null => {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate()
    if (typeof date.getTime === "function") return date.getTime()
  }
  return null
}

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

  removePlayerFromGame = async (
    collectionName: string,
    gameId: string,
    userId: string
  ) => {
    const gameRef = doc(db, collectionName, gameId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) return
      const data = snap.data() as StopModel
      const players = (data.players ?? []).filter((p) => p.id !== userId)
      tx.update(gameRef, { players })
    })
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

  getFriendProfile = async (uid: string): Promise<FriendProfile | null> => {
    const ref = doc(db, "users", uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data() ?? {}
    return {
      uid,
      name: data.name ?? null,
      photoURL: data.photoURL ?? null,
      email: data.email ?? null,
    }
  }

  markProfileSaved = async (user: {
    uid: string
    displayName?: string | null
    photoURL?: string | null
    email?: string | null
  }): Promise<void> => {
    if (!user?.uid) return
    const ref = doc(db, "users", user.uid)
    const data: Record<string, unknown> = {
      registered: true,
      updatedAt: serverTimestamp(),
    }
    if (user.displayName) data.name = user.displayName
    if (user.photoURL) data.photoURL = user.photoURL
    if (user.email) data.email = user.email
    await setDoc(ref, data, { merge: true })
  }

  updateUsername = async (
    uid: string,
    newName: string
  ): Promise<"changed" | "taken" | "error"> => {
    if (!uid) return "error"
    const trimmed = newName.trim()
    if (!trimmed) return "error"
    try {
      const q = query(collection(db, "users"), where("name", "==", trimmed))
      const snap = await getDocs(q)
      const taken = snap.docs.some((docSnap: any) => docSnap.id !== uid)
      if (taken) return "taken"
      await updateDoc(doc(db, "users", uid), {
        name: trimmed,
        updatedAt: serverTimestamp(),
      })
      return "changed"
    } catch (error) {
      console.log(error)
      return "error"
    }
  }

  onProfileSaved = (uid: string, callback: (saved: boolean) => void) => {
    const ref = doc(db, "users", uid)
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      callback(snapshot.exists())
    })
    return unsubscribe
  }

  onFriends = (uid: string, callback: (entries: FriendEntry[]) => void) => {
    const ref = collection(db, "users", uid, "friends")
    return onSnapshot(ref, (snapshot) => {
      const entries: FriendEntry[] = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name ?? null,
          photoURL: data.photoURL ?? null,
          addedAt: toTime(data.addedAt),
        }
      })
      callback(entries)
    })
  }

  onReceivedRequests = (
    uid: string,
    callback: (entries: FriendRequestEntry[]) => void
  ) => {
    const ref = collection(db, "users", uid, "receivedRequests")
    return onSnapshot(ref, (snapshot) => {
      const entries: FriendRequestEntry[] = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.fromName ?? null,
          photoURL: data.fromPhotoURL ?? null,
          sentAt: toTime(data.sentAt),
        }
      })
      callback(entries)
    })
  }

  onSentRequests = (
    uid: string,
    callback: (entries: FriendRequestEntry[]) => void
  ) => {
    const ref = collection(db, "users", uid, "sentRequests")
    return onSnapshot(ref, (snapshot) => {
      const entries: FriendRequestEntry[] = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.toName ?? null,
          photoURL: data.toPhotoURL ?? null,
          sentAt: toTime(data.sentAt),
        }
      })
      callback(entries)
    })
  }

  onGameInvites = (
    uid: string,
    callback: (entries: GameInviteEntry[]) => void
  ) => {
    const ref = collection(db, "users", uid, "gameInvites")
    return onSnapshot(ref, (snapshot) => {
      const entries: GameInviteEntry[] = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data()
        return {
          gameId: docSnap.id,
          hostUid: data.hostUid ?? "",
          hostName: data.hostName ?? null,
          hostPhotoURL: data.hostPhotoURL ?? null,
          currentTime: data.currentTime ?? null,
          maxRounds: data.maxRounds ?? null,
          sentAt: toTime(data.sentAt),
        }
      })
      callback(entries)
    })
  }

  sendGameInvite = async (
    gameId: string,
    fromId: string,
    fromName: string | null | undefined,
    fromPhotoURL: string | null | undefined,
    toId: string,
    toName: string | null | undefined,
    toPhotoURL: string | null | undefined,
    currentTime?: number | null,
    maxRounds?: number | null
  ): Promise<"ok" | "full" | "started" | "error"> => {
    if (!gameId || !fromId || !toId || fromId === toId) return "error"
    const gameRef = doc(db, "stop", gameId)
    const inviteRef = doc(db, "users", toId, "gameInvites", gameId)
    let result: "ok" | "full" | "started" | "error" = "error"

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef)
        if (!snap.exists()) return
        const data = snap.data() as StopModel
        if (data.gameStatus !== GameStatus.CREATED) {
          result = "started"
          return
        }
        if ((data.players ?? []).length >= 4) {
          result = "full"
          return
        }
        if ((data.players ?? []).some((p) => p.id === toId)) return

        tx.set(inviteRef, {
          hostUid: fromId,
          hostName: fromName ?? "Unknown",
          hostPhotoURL: fromPhotoURL ?? "",
          gameId,
          currentTime: currentTime ?? null,
          maxRounds: maxRounds ?? null,
          sentAt: serverTimestamp(),
        })
        tx.update(gameRef, {
          [`invites.${toId}`]: {
            name: toName ?? "Unknown",
            photoURL: toPhotoURL ?? "",
            status: "pending",
          },
        })
        result = "ok"
      })
      return result
    } catch (error) {
      console.log(error)
      return "error"
    }
  }

  acceptGameInvite = async (
    uid: string,
    name: string | null | undefined,
    photoURL: string | null | undefined,
    gameId: string
  ): Promise<"ok" | "full" | "started" | "closed" | "error"> => {
    if (!uid || !gameId) return "error"
    const gameRef = doc(db, "stop", gameId)
    const inviteRef = doc(db, "users", uid, "gameInvites", gameId)
    let result: "ok" | "full" | "started" | "closed" | "error" = "error"

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef)
        if (!snap.exists()) {
          tx.delete(inviteRef)
          result = "closed"
          return
        }
        const data = snap.data() as StopModel

        if (data.gameStatus !== GameStatus.CREATED) {
          tx.delete(inviteRef)
          tx.update(gameRef, { [`invites.${uid}.status`]: "declined" })
          result = "started"
          return
        }

        const alreadyIn = (data.players ?? []).some((p) => p.id === uid)
        if (alreadyIn) {
          tx.delete(inviteRef)
          tx.update(gameRef, { [`invites.${uid}.status`]: "joined" })
          result = "ok"
          return
        }

        if ((data.players ?? []).length >= 4) {
          tx.delete(inviteRef)
          tx.update(gameRef, { [`invites.${uid}.status`]: "declined" })
          result = "full"
          return
        }

        tx.update(gameRef, {
          players: [
            ...(data.players ?? []),
            {
              id: uid,
              name: name ?? "Unknown",
              points: 0,
              photoURL: photoURL ?? "",
            },
          ],
          [`invites.${uid}.status`]: "joined",
        })
        tx.delete(inviteRef)
        result = "ok"
      })
      return result
    } catch (error) {
      console.log(error)
      return "error"
    }
  }

  declineGameInvite = async (uid: string, gameId: string): Promise<void> => {
    if (!uid || !gameId) return
    try {
      await deleteDoc(doc(db, "users", uid, "gameInvites", gameId))
    } catch {
      /* ignore */
    }
    try {
      await updateDoc(doc(db, "stop", gameId), {
        [`invites.${uid}.status`]: "declined",
      })
    } catch {
      /* ignore */
    }
  }

  sendFriendRequest = async (
    fromId: string,
    fromName: string | null | undefined,
    fromPhotoURL: string | null | undefined,
    toId: string,
    toName: string | null | undefined,
    toPhotoURL: string | null | undefined
  ): Promise<void> => {
    if (!fromId || !toId || fromId === toId) return
    const sentRef = doc(db, "users", fromId, "sentRequests", toId)
    const receivedRef = doc(db, "users", toId, "receivedRequests", fromId)

    await runTransaction(db, async (tx) => {
      const [myFriend, theirFriend, sent, received] = await Promise.all([
        tx.get(doc(db, "users", fromId, "friends", toId)),
        tx.get(doc(db, "users", toId, "friends", fromId)),
        tx.get(sentRef),
        tx.get(receivedRef),
      ])
      if (myFriend.exists() || theirFriend.exists()) return
      if (sent.exists() || received.exists()) return

      tx.set(sentRef, {
        toName: toName ?? "Unknown",
        toPhotoURL: toPhotoURL ?? "",
        sentAt: serverTimestamp(),
      })
      tx.set(receivedRef, {
        fromName: fromName ?? "Unknown",
        fromPhotoURL: fromPhotoURL ?? "",
        sentAt: serverTimestamp(),
      })
    })
  }

  acceptFriendRequest = async (
    myId: string,
    myName: string | null | undefined,
    myPhotoURL: string | null | undefined,
    otherId: string,
    otherName: string | null | undefined,
    otherPhotoURL: string | null | undefined
  ): Promise<void> => {
    if (!myId || !otherId || myId === otherId) return
    await runTransaction(db, async (tx) => {
      tx.set(doc(db, "users", myId, "friends", otherId), {
        name: otherName ?? "Unknown",
        photoURL: otherPhotoURL ?? "",
        addedAt: serverTimestamp(),
      })
      tx.set(doc(db, "users", otherId, "friends", myId), {
        name: myName ?? "Unknown",
        photoURL: myPhotoURL ?? "",
        addedAt: serverTimestamp(),
      })
      tx.delete(doc(db, "users", myId, "receivedRequests", otherId))
      tx.delete(doc(db, "users", otherId, "sentRequests", myId))
    })
  }

  declineFriendRequest = async (myId: string, otherId: string): Promise<void> => {
    if (!myId || !otherId) return
    await deleteDoc(doc(db, "users", myId, "receivedRequests", otherId))
    await deleteDoc(doc(db, "users", otherId, "sentRequests", myId))
  }

  cancelFriendRequest = async (myId: string, otherId: string): Promise<void> => {
    if (!myId || !otherId) return
    await deleteDoc(doc(db, "users", myId, "sentRequests", otherId))
    await deleteDoc(doc(db, "users", otherId, "receivedRequests", myId))
  }

  removeFriend = async (myId: string, otherId: string): Promise<void> => {
    if (!myId || !otherId || myId === otherId) return
    await deleteDoc(doc(db, "users", myId, "friends", otherId))
    await deleteDoc(doc(db, "users", otherId, "friends", myId))
  }
}

export default new Fire()
