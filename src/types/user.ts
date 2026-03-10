export type UserRole = "mahasiswa" | "admin"
export type AuthProvider = "google" | "password"
export type UserTag = "Mahasiswa" | "Admin" | "Si Ambis" | "Verified Mentor" | "Mahasiswa Aktif"

export type User = {
  userId: string
  name: string
  email: string
  phoneNumber?: string
  avatar?: string
  provider: AuthProvider
  role: UserRole
  tag: UserTag
  createdAt: Date
}