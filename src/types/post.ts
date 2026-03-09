export type Post = {
  title: string
  description: string
  course: string
  userId: string
  price: number
  postUrl: string
  likes: number
  requestId?: string
  createdAt: Date
}