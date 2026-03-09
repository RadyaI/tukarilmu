export type UserRole = "mahasiswa" | "admin"

export type User = {
  userId: string
  name: string
  email: string
  phoneNumber?: string
  role: UserRole
  createdAt: Date
}