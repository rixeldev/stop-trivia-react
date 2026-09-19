import BottomSheet from "@gorhom/bottom-sheet"
import { RefObject, useEffect, useState } from "react"
import { Image, StyleSheet, Text, ToastAndroid, View } from "react-native"
import { useTranslation } from "react-i18next"
import { LinearGradient } from "expo-linear-gradient"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import { CheckIcon, UserIcon, UsersIcon } from "@/components/ui/Icons"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { Theme } from "@/constants/Theme"
import { auth } from "@/db/firebaseConfig"
import Fire from "@/db/Fire"
import { useFriends } from "@/hooks/useFriends"
import { StopPlayer, TTTPlayer } from "@/interfaces/Player"

interface Props {
  sheetRef: RefObject<BottomSheet | null>
  player: StopPlayer | TTTPlayer | null
  myUid?: string | null
  statValue?: number | null
  statLabel?: string
}

export const PlayerInfoSheet = ({
  sheetRef,
  player,
  myUid,
  statValue,
  statLabel,
}: Props) => {
  const { t } = useTranslation()
  const { received, receivedIds, sentIds, friendsIds } = useFriends(myUid)
  const [workingId, setWorkingId] = useState("")

  const targetId = player?.id ?? ""
  const isSelf = !!myUid && !!targetId && myUid === targetId
  const isFriend = !isSelf && !!myUid && !!targetId && friendsIds.has(targetId)
  const pendingReceived =
    !isSelf && !!myUid && !!targetId && receivedIds.has(targetId)
  const pendingSent = !isSelf && !!myUid && !!targetId && sentIds.has(targetId)
  const receivedEntry = received.find((request) => request.id === targetId)

  useEffect(() => {
    setWorkingId("")
  }, [targetId])

  const me = auth.currentUser

  const showToast = (message: string) => {
    ToastAndroid.showWithGravity(
      message,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    )
  }

  const handleAddFriend = async () => {
    if (!me?.uid || !targetId) return
    setWorkingId(targetId)
    try {
      await Fire.sendFriendRequest(
        me.uid,
        me.displayName,
        me.photoURL,
        targetId,
        player?.name,
        player?.photoURL,
      )
      showToast(t("request_sent"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleAccept = async () => {
    if (!me?.uid || !targetId) return
    setWorkingId(targetId)
    try {
      await Fire.acceptFriendRequest(
        me.uid,
        me.displayName,
        me.photoURL,
        targetId,
        receivedEntry?.name,
        receivedEntry?.photoURL,
      )
      showToast(t("friend_request_accepted"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleDecline = async () => {
    if (!me?.uid || !targetId) return
    setWorkingId(targetId)
    try {
      await Fire.declineFriendRequest(me.uid, targetId)
      showToast(t("request_declined"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleCancel = async () => {
    if (!me?.uid || !targetId) return
    setWorkingId(targetId)
    try {
      await Fire.cancelFriendRequest(me.uid, targetId)
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleRemove = async () => {
    if (!me?.uid || !targetId) return
    setWorkingId(targetId)
    try {
      await Fire.removeFriend(me.uid, targetId)
      showToast(t("friend_removed"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const loading = workingId === targetId

  return (
    <BottomSheetModal
      title={player?.name ?? ""}
      description={
        statValue !== undefined
          ? `${statValue ?? 0} ${statLabel ?? t("points")}`
          : player
            ? `${"points" in player ? (player.points ?? 0) : 0} ${t("points")}`
            : undefined
      }
      ref={sheetRef}
      icon={<UsersIcon size={20} color={Theme.colors.primarySoft} />}
    >
      <LinearGradient
        colors={Theme.gradients.cardHigh}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.avatar}>
          {player?.photoURL ? (
            <Image
              style={styles.avatarImage}
              source={{ uri: player.photoURL }}
            />
          ) : (
            <UserIcon size={32} color={Theme.colors.primarySoft} />
          )}
        </View>

        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={2}>
            {player?.name}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {player?.id}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.actions}>
        {isSelf ? (
          <Text style={styles.hint}>{t("that_is_you")}</Text>
        ) : isFriend ? (
          <>
            <PrimaryButton
              title={t("already_friends")}
              onPress={() => {}}
              icon={<CheckIcon size={18} color={Theme.colors.text} />}
              block
              disabled
            />
            <SecondaryButton
              title={t("remove_friend")}
              onPress={handleRemove}
              danger
              block
              loading={loading}
            />
          </>
        ) : pendingReceived ? (
          <>
            <View style={styles.rowBtns}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title={t("accept_request")}
                  onPress={handleAccept}
                  loading={loading}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  title={t("decline_request")}
                  onPress={handleDecline}
                  danger
                  loading={loading}
                />
              </View>
            </View>
          </>
        ) : pendingSent ? (
          <>
            <PrimaryButton
              title={t("request_sent")}
              onPress={() => {}}
              block
              disabled
            />
            <SecondaryButton
              title={t("cancel_request")}
              onPress={handleCancel}
              block
              loading={loading}
            />
          </>
        ) : (
          <PrimaryButton
            title={t("add_friend")}
            onPress={handleAddFriend}
            block
            loading={loading}
          />
        )}
      </View>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    padding: Theme.spacing.l,
    borderRadius: Theme.radii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    marginBottom: Theme.spacing.l,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  cardSubtitle: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
  },
  actions: {
    gap: Theme.spacing.s,
  },
  rowBtns: {
    flexDirection: "row",
    gap: Theme.spacing.s,
  },
  hint: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
  },
})
