export type Purchase = {
  userId: string;
  creatorId: string;
  type: "video" | "post";
  materialId: string;
  price: number;
  netAmount: number;    
  platformFee: number;  
  createdAt: Date;
};