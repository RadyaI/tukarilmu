export type UserRole = "mahasiswa" | "admin"
export type AuthProvider = "google" | "password"

export type User = {
  userId: string
  name: string
  email: string
  phoneNumber?: string
  avatar?: string
  provider: AuthProvider
  role: UserRole
  createdAt: Date
}