import { Jurusan } from "./jurusan";

export type Video = {
  title: string
  thumbnailUrl?: string
  description: string
  course: string
  jurusan: Jurusan | string
  userId: string
  authorName?: string
  price: number
  videoUrl: string
  likes: number
  requestId?: string
  createdAt: Date
}