export type RequestStatus = "open" | "taken" | "submitted" | "canceled" | "done"
export type Type = "post" | "video"

export type Request = {
  title: string
  description: string
  reward: number
  type?: Type
  requesterId: string
  takerId: string | null
  materialId: string | null
  status: RequestStatus
  message?: string | null
  deadline?: Date
  createdAt: Date
}