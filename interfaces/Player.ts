import { StopGameInputs } from "./StopGameInputs"

export interface StopPlayer {
  id?: string | null
  name?: string | null
  points: number
  photoURL?: string
  inputs?: StopGameInputs
  inputsRound?: number
}

export interface TTTPlayer {
  id?: string | null
  name?: string | null
  pos: string
  wins: number
  photoURL?: string
  inputs?: StopGameInputs
}
