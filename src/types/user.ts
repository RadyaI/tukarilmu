import { Jurusan } from "./jurusan";

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

  bio?: string
  kampus?: string
  jurusan?: Jurusan | null
  angkatan?: string | null
  semester?: string | null

  igUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
}