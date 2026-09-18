import { Stack, useNavigation } from "expo-router"
import { useTranslation } from "react-i18next"
import { useEffect, useRef, useState } from "react"
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import BottomSheet from "@gorhom/bottom-sheet"
import {
  BackIcon,
  CheckIcon,
  CloseIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/Icons"
import { Theme } from "@/constants/Theme"
import { auth } from "@/db/firebaseConfig"
import Fire from "@/db/Fire"
import { useFriends } from "@/hooks/useFriends"
import { FriendEntry, FriendProfile } from "@/interfaces/User"
import { Screen } from "@/components/ui/Screen"
import { BottomSheetModal } from "@/components/BottomSheetModal"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { CustomModal } from "@/components/CustomModal"

type Confirm = null | {
  type: "cancel" | "decline" | "remove"
  id: string
  name?: string | null
}

type Lookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "self" }
  | { status: "profile"; profile: FriendProfile }

type Relation = "none" | "friend" | "sent" | "received" | "self"

export default function Friends() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [userId, setUserId] = useState<string>()
  const [addId, setAddId] = useState("")
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" })
  const [workingId, setWorkingId] = useState("")
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [selectedFriend, setSelectedFriend] = useState<FriendEntry | null>(null)
  const friendSheetRef = useRef<BottomSheet>(null)

  const { friends, received, sent, friendsIds, receivedIds, sentIds } =
    useFriends(userId)

  useEffect(() => {
    setUserId(auth.currentUser?.uid)
  }, [])

  const me = auth.currentUser

  const showToast = (message: string) => {
    ToastAndroid.showWithGravity(
      message,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    )
  }

  const handleSearch = async () => {
    const id = addId.trim()
    if (!id) {
      showToast(t("enter_user_id"))
      return
    }
    if (id === userId) {
      setLookup({ status: "self" })
      return
    }

    setLookup({ status: "loading" })
    const profile = await Fire.getFriendProfile(id)
    if (!profile) {
      setLookup({ status: "notfound" })
      return
    }
    setLookup({ status: "profile", profile })
  }

  const relationFor = (profile: FriendProfile): Relation => {
    if (profile.uid === userId) return "self"
    if (friendsIds.has(profile.uid)) return "friend"
    if (sentIds.has(profile.uid)) return "sent"
    if (receivedIds.has(profile.uid)) return "received"
    return "none"
  }

  const handleSendRequest = async (profile: FriendProfile) => {
    if (!me?.uid) return
    setWorkingId(profile.uid)
    try {
      await Fire.sendFriendRequest(
        me.uid,
        me.displayName,
        me.photoURL,
        profile.uid,
        profile.name,
        profile.photoURL,
      )
      showToast(t("request_sent"))
      setAddId("")
      setLookup({ status: "idle" })
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleAccept = async (otherId: string) => {
    if (!me?.uid || !otherId) return
    setWorkingId(otherId)
    try {
      const request = received.find((entry) => entry.id === otherId)
      await Fire.acceptFriendRequest(
        me.uid,
        me.displayName,
        me.photoURL,
        otherId,
        request?.name,
        request?.photoURL,
      )
      showToast(t("friend_request_accepted"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const openCancelConfirm = (id: string, name?: string | null) => {
    if (workingId === id) return
    setConfirm({ type: "cancel", id, name })
  }

  const openDeclineConfirm = (id: string, name?: string | null) => {
    if (workingId === id) return
    setConfirm({ type: "decline", id, name })
  }

  const openRemoveConfirm = (id: string, name?: string | null) => {
    if (workingId === id) return
    setConfirm({ type: "remove", id, name })
  }

  const confirmAccept = async () => {
    if (!confirm || !me?.uid) return
    const { type, id } = confirm
    setWorkingId(id)
    try {
      if (type === "cancel") {
        await Fire.cancelFriendRequest(me.uid, id)
        showToast(t("request_cancelled"))
      } else if (type === "decline") {
        await Fire.declineFriendRequest(me.uid, id)
        showToast(t("request_declined"))
      } else {
        await Fire.removeFriend(me.uid, id)
        showToast(t("friend_removed"))
        friendSheetRef.current?.close()
      }
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
      setConfirm(null)
    }
  }

  const confirmTitle = confirm
    ? confirm.type === "cancel"
      ? t("confirm_cancel_request")
      : confirm.type === "decline"
        ? t("confirm_decline_request")
        : t("confirm_remove_friend")
    : ""

  const confirmDescription = confirm
    ? confirm.type === "cancel"
      ? t("confirm_cancel_request_desc", { name: confirm.name ?? "" })
      : confirm.type === "decline"
        ? t("confirm_decline_request_desc", { name: confirm.name ?? "" })
        : t("confirm_remove_friend_desc", { name: confirm.name ?? "" })
    : ""

  const confirmAcceptLabel = confirm
    ? confirm.type === "cancel"
      ? t("cancel_request")
      : confirm.type === "decline"
        ? t("decline_request")
        : t("remove_friend")
    : ""

  const openFriendSheet = (friend: FriendEntry) => {
    setSelectedFriend(friend)
    setTimeout(() => friendSheetRef.current?.expand(), 300)
  }

  const renderLookup = () => {
    switch (lookup.status) {
      case "loading":
        return (
          <View style={styles.lookupBox}>
            <Text style={styles.lookupText}>{t("searching_user")}</Text>
          </View>
        )
      case "notfound":
        return (
          <View style={styles.lookupBox}>
            <Text style={styles.lookupError}>{t("user_not_found")}</Text>
          </View>
        )
      case "self":
        return (
          <View style={styles.lookupBox}>
            <Text style={styles.lookupText}>{t("that_is_you")}</Text>
          </View>
        )
      case "profile": {
        const relation = relationFor(lookup.profile)
        return (
          <View style={styles.lookupCard}>
            <View style={styles.avatar}>
              {lookup.profile.photoURL ? (
                <Image
                  style={styles.avatarImage}
                  source={{ uri: lookup.profile.photoURL }}
                />
              ) : (
                <UserIcon size={22} color={Theme.colors.primarySoft} />
              )}
            </View>
            <View style={styles.lookupTextWrap}>
              <Text style={styles.lookupName} numberOfLines={1}>
                {lookup.profile.name ?? "Unknown"}
              </Text>
              <Text style={styles.lookupId} numberOfLines={1}>
                {lookup.profile.uid}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.actionPill,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              disabled={workingId === lookup.profile.uid}
              onPress={() => {
                if (relation === "received") handleAccept(lookup.profile.uid)
                else if (relation === "sent")
                  openCancelConfirm(lookup.profile.uid, lookup.profile.name)
                else if (relation === "friend") {
                  /* no-op */
                } else handleSendRequest(lookup.profile)
              }}
            >
              <Text style={styles.actionPillText}>
                {relation === "received"
                  ? t("accept_request")
                  : relation === "sent"
                    ? t("cancel_request")
                    : relation === "friend"
                      ? t("already_friends")
                      : t("send_request")}
              </Text>
            </Pressable>
          </View>
        )
      }
      default:
        return null
    }
  }

  return (
    <Screen padding={0}>
      <Stack.Screen
        options={{
          headerTintColor: Theme.colors.text,
          headerTitle: t("friends"),
          headerTitleStyle: {
            fontSize: Theme.sizes.h0,
            fontFamily: Theme.fonts.onestBold,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.headerBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <BackIcon size={22} color={Theme.colors.primarySoft} />
            </Pressable>
          ),
          headerRight: () => null,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={Theme.gradients.cardHigh}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addCard}
        >
          <View style={styles.addHeader}>
            <View style={styles.addIconTile}>
              <UsersIcon size={22} color={Theme.colors.primarySoft} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.addTitle}>{t("add_by_id")}</Text>
              <Text style={styles.addDesc}>{t("add_by_id_desc")}</Text>
            </View>
          </View>

          <View style={styles.addRow}>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={addId}
                onChangeText={(text) => {
                  setAddId(text.trim())
                  setLookup({ status: "idle" })
                }}
                placeholder={t("enter_user_id")}
                placeholderTextColor={Theme.colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.searchBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleSearch}
              disabled={lookup.status === "loading"}
            >
              <Text style={styles.searchBtnText}>{t("search")}</Text>
            </Pressable>
          </View>

          {renderLookup()}
        </LinearGradient>

        <Text style={styles.sectionLabel}>
          {t("requests")} {received.length > 0 && `· ${received.length}`}
        </Text>

        <View style={styles.group}>
          {received.length === 0 ? (
            <Text style={styles.emptyText}>{t("no_requests")}</Text>
          ) : (
            received.map((request) => (
              <View key={request.id}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    {request.photoURL ? (
                      <Image
                        style={styles.avatarImage}
                        source={{ uri: request.photoURL }}
                      />
                    ) : (
                      <UserIcon size={20} color={Theme.colors.primarySoft} />
                    )}
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {request.name ?? "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconBtn,
                        styles.iconBtnAccept,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      disabled={workingId === request.id}
                      onPress={() => handleAccept(request.id)}
                    >
                      <CheckIcon size={18} color={Theme.colors.text} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconBtn,
                        styles.iconBtnDanger,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      disabled={workingId === request.id}
                      onPress={() =>
                        openDeclineConfirm(request.id, request.name)
                      }
                    >
                      <CloseIcon size={18} color={Theme.colors.text} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.divider} />
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionLabel}>
          {t("sent_requests")} {sent.length > 0 && `· ${sent.length}`}
        </Text>

        <View style={styles.group}>
          {sent.length === 0 ? (
            <Text style={styles.emptyText}>{t("no_sent_requests")}</Text>
          ) : (
            sent.map((request) => (
              <View key={request.id}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    {request.photoURL ? (
                      <Image
                        style={styles.avatarImage}
                        source={{ uri: request.photoURL }}
                      />
                    ) : (
                      <UserIcon size={20} color={Theme.colors.primarySoft} />
                    )}
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {request.name ?? "Unknown"}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.textAction,
                      styles.textActionDanger,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    disabled={workingId === request.id}
                    onPress={() => openCancelConfirm(request.id, request.name)}
                  >
                    <Text style={styles.textActionLabel}>
                      {t("cancel_request")}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.divider} />
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionLabel}>
          {t("friends")} {friends.length > 0 && `· ${friends.length}`}
        </Text>

        <View style={styles.group}>
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>{t("no_friends")}</Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.id}>
                <View style={styles.row}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.rowTap,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => openFriendSheet(friend)}
                  >
                    <View style={styles.avatar}>
                      {friend.photoURL ? (
                        <Image
                          style={styles.avatarImage}
                          source={{ uri: friend.photoURL }}
                        />
                      ) : (
                        <UserIcon size={20} color={Theme.colors.primarySoft} />
                      )}
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {friend.name ?? "Unknown"}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconBtn,
                      styles.iconBtnDanger,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    disabled={workingId === friend.id}
                    onPress={() => openRemoveConfirm(friend.id, friend.name)}
                  >
                    <CloseIcon size={18} color={Theme.colors.text} />
                  </Pressable>
                </View>
                <View style={styles.divider} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={friendSheetRef}
        title={t("friend_profile")}
        description={t("friend_profile_desc")}
        icon={<UserIcon size={20} color={Theme.colors.primarySoft} />}
      >
        <LinearGradient
          colors={Theme.gradients.cardHigh}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheetCard}
        >
          <View style={styles.sheetAvatar}>
            {selectedFriend?.photoURL ? (
              <Image
                style={styles.avatarImage}
                source={{ uri: selectedFriend.photoURL }}
              />
            ) : (
              <UserIcon size={32} color={Theme.colors.primarySoft} />
            )}
          </View>
          <View style={styles.sheetText}>
            <Text style={styles.sheetName} numberOfLines={2}>
              {selectedFriend?.name}
            </Text>
            <Text style={styles.sheetId} numberOfLines={1}>
              {selectedFriend?.id}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sheetActions}>
          <LinearGradient
            colors={[Theme.colors.surfaceHigh, Theme.colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <CheckIcon size={22} color={Theme.colors.primarySoft} />
            <Text
              style={{
                color: Theme.colors.text,
                fontFamily: Theme.fonts.onestBold,
                fontSize: Theme.sizes.h4,
              }}
            >
              {t("already_friends")}
            </Text>
          </LinearGradient>

          <SecondaryButton
            title={t("remove_friend")}
            onPress={() => {
              if (selectedFriend)
                openRemoveConfirm(selectedFriend.id, selectedFriend.name)
            }}
            danger
            block
            loading={workingId === selectedFriend?.id}
          />
        </View>
      </BottomSheetModal>

      <CustomModal
        title={confirmTitle}
        description={confirmDescription}
        modalVisible={confirm !== null}
        onRequestClose={() => setConfirm(null)}
        onAccept={confirmAccept}
        acceptLabel={confirmAcceptLabel}
        danger={confirm?.type !== "cancel"}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
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
  scrollContent: {
    padding: Theme.spacing.l,
    paddingTop: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  addCard: {
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.l,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    ...Theme.shadows.glow,
  },
  addHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
  },
  addIconTile: {
    width: 44,
    height: 44,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addTitle: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  addDesc: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    lineHeight: 15,
  },
  addRow: {
    flexDirection: "row",
    gap: Theme.spacing.s,
    alignItems: "center",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.m,
    height: 44,
    justifyContent: "center",
  },
  input: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    padding: 0,
  },
  searchBtn: {
    backgroundColor: Theme.colors.primarySoft,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.l,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h5,
  },
  lookupBox: {
    marginTop: Theme.spacing.m,
    padding: Theme.spacing.m,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  lookupText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
  },
  lookupError: {
    color: Theme.colors.red,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
  },
  lookupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    marginTop: Theme.spacing.m,
    padding: Theme.spacing.m,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  lookupTextWrap: {
    flex: 1,
    gap: 2,
  },
  lookupName: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  lookupId: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
  },
  actionPill: {
    backgroundColor: Theme.colors.primary2,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.pill,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
  },
  actionPillText: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
  },
  sectionLabel: {
    color: Theme.colors.darkGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: Theme.spacing.s,
    marginBottom: -Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.s,
  },
  group: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.xl,
    overflow: "hidden",
    ...Theme.shadows.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    padding: Theme.spacing.m,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
  },
  sheetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.m,
    padding: Theme.spacing.l,
    borderRadius: Theme.radii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    marginBottom: Theme.spacing.l,
  },
  sheetAvatar: {
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
  sheetText: {
    flex: 1,
    gap: 2,
  },
  sheetName: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  sheetId: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
  },
  sheetActions: {
    gap: Theme.spacing.s,
  },
  rowTitle: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  rowActions: {
    flexDirection: "row",
    gap: Theme.spacing.s,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Theme.radii.m,
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Theme.radii.m,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnAccept: {
    backgroundColor: Theme.colors.primary2,
    borderWidth: 1,
    borderColor: Theme.colors.primarySoft,
  },
  iconBtnDanger: {
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.red,
  },
  textAction: {
    borderRadius: Theme.radii.pill,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    borderWidth: 1,
  },
  textActionDanger: {
    borderColor: Theme.colors.red,
  },
  textActionLabel: {
    color: Theme.colors.red,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h6,
  },
  emptyText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    textAlign: "center",
    padding: Theme.spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
    marginLeft: 64,
    opacity: 0.6,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
    opacity: 0.8,
  },
})
