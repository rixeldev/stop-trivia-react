import { StopPlayer, TTTPlayer } from "@/interfaces/Player"
import { StopGameInputs } from "@/interfaces/StopGameInputs"

export interface StopInvite {
  name?: string | null
  photoURL?: string | null
  status: "pending" | "declined" | "joined"
}

export interface GameInviteEntry {
  gameId: string
  hostUid: string
  hostName?: string | null
  hostPhotoURL?: string | null
  currentTime?: number | null
  maxRounds?: number | null
  sentAt?: number | null
}

export interface StopModel {
  gameId: string
  round: number
  currentLetter: string
  currentTime: number
  gameStatus: GameStatus
  playersReady: number
  players: StopPlayer[]
  host: string
  startTime: number
  timestamp: number
  scoring?: Record<string, boolean> | null
  scoredRound?: number | null
  reviews?: Record<string, StopReviewSubmission> | null
  reviewedRound?: number | null
  maxRounds?: number | null
  finished?: boolean
  invites?: Record<string, StopInvite> | null
}

export interface WordReview {
  same: boolean
  accepted: boolean
}

export type StopReviewsByInput = Partial<
  Record<keyof StopGameInputs, WordReview>
>

export type StopReviewSubmission = Record<string, StopReviewsByInput>

export interface TTTModel {
  gameId: string
  round: number
  currentPlayer: string
  gameStatus: GameStatus
  players: TTTPlayer[]
  filledPos: string[]
  host: string
  startTime: number
  timestamp: number
}

export enum GameStatus {
  CREATED,
  IN_PROGRESS,
  STOPPED,
}
