import { useMemo, useRef, useState } from "react"
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { Theme } from "@/constants/Theme"
import { Badge } from "@/components/ui/Badge"
import { CheckIcon, CloseIcon } from "@/components/ui/Icons"
import { StopPlayer } from "@/interfaces/Player"
import { StopGameInputs } from "@/interfaces/StopGameInputs"
import { StopReviewSubmission } from "@/interfaces/Game"
import { INPUT_KEYS, normalizeWord } from "@/libs/scoring"

const FIELD_LABELS: Record<keyof StopGameInputs, string> = {
  name: "name",
  lastName: "last_name",
  country: "country",
  color: "color",
  animal: "animal",
  artist: "artist",
  food: "food",
  fruit: "fruit",
  object: "object",
  profession: "profession",
}

interface ReviewItem {
  inputKey: keyof StopGameInputs
  targetId: string
  targetName: string
  targetWord: string
  myWord: string
}

interface Props {
  players: StopPlayer[]
  myId: string
  myInputs: StopGameInputs
  letter: string
  onSubmit: (review: StopReviewSubmission) => void
}

export const ReviewWizard = ({
  players,
  myId,
  myInputs,
  letter,
  onSubmit,
}: Props) => {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [sameChoice, setSameChoice] = useState<boolean | null>(null)
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const draftRef = useRef<StopReviewSubmission>({})

  const items = useMemo<ReviewItem[]>(() => {
    const result: ReviewItem[] = []
    for (const inputKey of INPUT_KEYS) {
      const myWord = normalizeWord(myInputs[inputKey])
      for (const player of players) {
        if (!player.id || player.id === myId) continue
        const word = (player.inputs?.[inputKey] ?? "").trim()
        if (word === "") continue
        result.push({
          inputKey,
          targetId: player.id,
          targetName: player.name ?? "",
          targetWord: word,
          myWord,
        })
      }
    }
    return result
  }, [players, myId, myInputs])

  const item = items[index]
  const isLast = index === items.length - 1
  const canCompare = item ? item.myWord !== "" : false
  const compareBlocked = canCompare && sameChoice === null

  const record = (accepted: boolean) => {
    if (!item) return
    const targetReviews = draftRef.current[item.targetId] ?? {}
    targetReviews[item.inputKey] = {
      same: sameChoice ?? false,
      accepted,
    }
    draftRef.current[item.targetId] = targetReviews
  }

  const advance = () => {
    if (isLast) {
      onSubmit(draftRef.current)
      return
    }
    setSameChoice(null)
    setRejectConfirm(false)
    setIndex((current) => current + 1)
  }

  const handleConfirm = () => {
    if (compareBlocked) return
    record(true)
    advance()
  }

  const handleRejectPress = () => {
    if (compareBlocked) return
    setRejectConfirm(true)
  }

  const handleRejectConfirm = () => {
    record(false)
    advance()
  }

  if (!item) {
    return (
      <Modal
        animationType="fade"
        transparent
        visible
        onRequestClose={() => {}}
      >
        <LinearGradient
          colors={Theme.gradients.overlay}
          style={styles.overlay}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{t("review_title")}</Text>
            <Text style={styles.desc}>{t("no_words_to_review")}</Text>
            <Pressable
              onPress={() => onSubmit({})}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={Theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmGradient}
              >
                <Text style={styles.confirmGradientText}>
                  {t("empty_review_confirm")}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </Modal>
    )
  }

  return (
    <Modal animationType="slide" transparent visible onRequestClose={() => {}}>
      <LinearGradient
        colors={Theme.gradients.overlay}
        style={styles.overlay}
      >
        {rejectConfirm ? (
          <View style={styles.card}>
            <View style={styles.rejectBadge}>
              <CloseIcon size={24} color={Theme.colors.red} />
            </View>
            <Text style={styles.title}>{t("reject_confirm_title")}</Text>
            <Text style={styles.desc}>
              {t("reject_confirm_desc", {
                name: item.targetName,
                word: item.targetWord,
                category: t(FIELD_LABELS[item.inputKey]),
              })}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setRejectConfirm(false)}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 },
                  styles.plainBtn,
                ]}
              >
                <Text style={styles.plainBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleRejectConfirm}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={Theme.gradients.danger}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dangerGradient}
                >
                  <Text style={styles.dangerText}>{t("reject_word")}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Badge variant="accent">{t("review_title")}</Badge>
              <Text style={styles.progress}>
                {t("review_progress", {
                  current: index + 1,
                  total: items.length,
                })}
              </Text>
            </View>

            <View style={styles.categoryRow}>
              <Text style={styles.category}>
                {t(FIELD_LABELS[item.inputKey])}
              </Text>
              <View style={styles.letterChip}>
                <Text style={styles.letter}>{letter}</Text>
              </View>
            </View>

            <View style={styles.wordBlock}>
              <Text style={styles.wordLabel}>{t("you_wrote")}</Text>
              <Text
                style={[styles.youWord, item.myWord === "" && styles.emptyWord]}
              >
                {item.myWord === "" ? t("fill_spaces") : item.myWord}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.wordBlock}>
              <Text style={styles.wordLabel}>
                {t("wrote", { name: item.targetName })}
              </Text>
              <Text style={styles.theirWord}>{item.targetWord}</Text>
            </View>

            {canCompare && (
              <View style={styles.compareRow}>
                <Pressable
                  onPress={() => setSameChoice(true)}
                  style={({ pressed }) => [
                    styles.compareBtn,
                    sameChoice === true && styles.compareBtnSelected,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.compareText,
                      sameChoice === true && styles.compareTextSelected,
                    ]}
                  >
                    {t("same_word")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSameChoice(false)}
                  style={({ pressed }) => [
                    styles.compareBtn,
                    sameChoice === false && styles.compareBtnSelected,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.compareText,
                      sameChoice === false && styles.compareTextSelected,
                    ]}
                  >
                    {t("different_word")}
                  </Text>
                </Pressable>
              </View>
            )}

            {canCompare && sameChoice === null && (
              <Text style={styles.hint}>{t("review_hint")}</Text>
            )}

            <View style={styles.actions}>
              <Pressable
                onPress={handleRejectPress}
                disabled={compareBlocked}
                style={({ pressed }) => [
                  styles.rejectBtn,
                  compareBlocked && styles.disabledBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <CloseIcon size={20} color={Theme.colors.red} />
                <Text style={styles.rejectText}>{t("reject_word")}</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={compareBlocked}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  compareBlocked && styles.disabledBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <CheckIcon size={20} color={Theme.colors.green} />
                <Text style={styles.confirmText}>{t("confirm_word")}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </LinearGradient>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.l,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.xl,
    gap: Theme.spacing.s,
    ...Theme.shadows.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.s,
  },
  progress: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h5,
    fontVariant: ["tabular-nums"],
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.lg,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
    marginBottom: Theme.spacing.s,
  },
  category: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  letterChip: {
    minWidth: 44,
    height: 44,
    borderRadius: Theme.radii.m,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary2,
    borderWidth: 1,
    borderColor: Theme.colors.primarySoft,
  },
  letter: {
    color: Theme.colors.primarySoft,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
  },
  wordBlock: {
    alignItems: "center",
    gap: Theme.spacing.xs,
    paddingVertical: Theme.spacing.s,
  },
  wordLabel: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  youWord: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h3,
    textAlign: "center",
  },
  emptyWord: {
    color: Theme.colors.darkGray,
  },
  theirWord: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h2,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
    marginVertical: Theme.spacing.s,
  },
  compareRow: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    marginTop: Theme.spacing.s,
  },
  compareBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.radii.m,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  compareBtnSelected: {
    backgroundColor: Theme.colors.primary2,
    borderColor: Theme.colors.primarySoft,
  },
  compareText: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h5,
  },
  compareTextSelected: {
    color: Theme.colors.primarySoft,
  },
  hint: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h6,
    textAlign: "center",
    marginTop: Theme.spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: Theme.spacing.m,
    marginTop: Theme.spacing.l,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.red,
    borderRadius: Theme.radii.m,
    paddingVertical: Theme.spacing.m,
  },
  rejectText: {
    color: Theme.colors.red,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.s,
    backgroundColor: Theme.colors.primary2,
    borderWidth: 1,
    borderColor: Theme.colors.green,
    borderRadius: Theme.radii.m,
    paddingVertical: Theme.spacing.m,
  },
  confirmText: {
    color: Theme.colors.green,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  rejectBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.red,
    marginBottom: Theme.spacing.s,
  },
  title: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h3,
    textAlign: "center",
  },
  desc: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onest,
    fontSize: Theme.sizes.h5,
    lineHeight: 21,
    textAlign: "center",
  },
  plainBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    borderRadius: Theme.radii.m,
  },
  plainBtnText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  dangerGradient: {
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radii.m,
  },
  dangerText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
  confirmGradient: {
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radii.m,
    alignItems: "center",
    marginTop: Theme.spacing.l,
  },
  confirmGradientText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.onestBold,
    fontSize: Theme.sizes.h4,
  },
})