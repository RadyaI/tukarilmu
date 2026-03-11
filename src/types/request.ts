export type RequestStatus = "open" | "taken" | "failed" | "done"

export type Request = {
  title: string
  description: string
  reward: number
  requesterId: string
  takerId: string | null
  materialId: string | null
  status: RequestStatus
  deadline?: Date
  createdAt: Date
}