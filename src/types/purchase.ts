export type Purchase = {
    userId: string
    type: "video" | "post"
    materialId: string
    price: number
    createdAt: Date
}