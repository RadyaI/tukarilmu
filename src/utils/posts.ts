import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { Post } from "../types/post";

export const getPreviewRequests = async (): Promise<(Post & { id: string })[]> => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(4));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post & { id: string }));
  } catch (error) {
    return [];
  }
};