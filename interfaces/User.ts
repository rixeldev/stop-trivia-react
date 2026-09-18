export interface FriendProfile {
  uid: string
  name?: string | null
  photoURL?: string | null
  email?: string | null
}

export interface FriendEntry {
  id: string
  name?: string | null
  photoURL?: string | null
  addedAt?: number | null
}

export interface FriendRequestEntry {
  id: string
  name?: string | null
  photoURL?: string | null
  sentAt?: number | null
}