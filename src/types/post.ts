import { Jurusan } from "./jurusan";

export type Post = {
  title: string
  description: string
  thumbnailUrl?: string
  course: string
  jurusan: Jurusan | string
  userId: string
  price: number
  content: string
  likes: number
  requestId?: string
  createdAt: Date
}