import { useEffect, useMemo, useState } from "react"
import Fire from "@/db/Fire"
import { FriendEntry, FriendRequestEntry } from "@/interfaces/User"

export function useFriends(uid?: string | null) {
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [received, setReceived] = useState<FriendRequestEntry[]>([])
  const [sent, setSent] = useState<FriendRequestEntry[]>([])

  useEffect(() => {
    if (!uid) return

    const unsubscribers = [
      Fire.onFriends(uid, setFriends),
      Fire.onReceivedRequests(uid, setReceived),
      Fire.onSentRequests(uid, setSent),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [uid])

  const friendsIds = useMemo(
    () => new Set(friends.map((friend) => friend.id)),
    [friends],
  )
  const receivedIds = useMemo(
    () => new Set(received.map((request) => request.id)),
    [received],
  )
  const sentIds = useMemo(
    () => new Set(sent.map((request) => request.id)),
    [sent],
  )

  const isFriend = (id: string) =>
    !!id && friendsIds.has(id)

  return { friends, received, sent, friendsIds, receivedIds, sentIds, isFriend }
}