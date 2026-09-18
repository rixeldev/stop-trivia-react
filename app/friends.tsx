import { Stack, useNavigation } from "expo-router"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
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
import { FriendProfile } from "@/interfaces/User"
import { Screen } from "@/components/ui/Screen"

type Lookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "self" }
  | { status: "profile"; profile: FriendProfile }

type Relation =
  | "none"
  | "friend"
  | "sent"
  | "received"
  | "self"

export default function Friends() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [userId, setUserId] = useState<string>()
  const [addId, setAddId] = useState("")
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" })
  const [workingId, setWorkingId] = useState("")

  const { friends, received, sent, friendsIds, receivedIds, sentIds } =
    useFriends(userId)

  useEffect(() => {
    setUserId(auth.currentUser?.uid)
  }, [])

  const me = auth.currentUser

  const showToast = (message: string) => {
    ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.BOTTOM)
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

  const handleDecline = async (otherId: string) => {
    if (!me?.uid || !otherId) return
    setWorkingId(otherId)
    try {
      await Fire.declineFriendRequest(me.uid, otherId)
      showToast(t("request_declined"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleCancel = async (otherId: string) => {
    if (!me?.uid || !otherId) return
    setWorkingId(otherId)
    try {
      await Fire.cancelFriendRequest(me.uid, otherId)
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
  }

  const handleRemove = async (otherId: string) => {
    if (!me?.uid || !otherId) return
    setWorkingId(otherId)
    try {
      await Fire.removeFriend(me.uid, otherId)
      showToast(t("friend_removed"))
    } catch {
      /* ignore */
    } finally {
      setWorkingId("")
    }
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
                else if (relation === "sent") handleCancel(lookup.profile.uid)
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
                      onPress={() => handleDecline(request.id)}
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
                    onPress={() => handleCancel(request.id)}
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
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconBtn,
                      styles.iconBtnDanger,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    disabled={workingId === friend.id}
                    onPress={() => handleRemove(friend.id)}
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
})