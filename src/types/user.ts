export type UserRole = "mahasiswa" | "admin"
export type AuthProvider = "google" | "password"
export type UserTag = "Mahasiswa" | "Admin" | "Mahasiswa Aktif" | "Mahasiswa Super"

export type User = {
  userId: string
  name: string
  email: string
  phoneNumber?: string
  avatar?: string
  provider: AuthProvider
  role: UserRole
  tag: UserTag
  banned?: boolean
  createdAt: Date
}