import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { Video } from "../types/video";

export const getPopularVideos = async (): Promise<(Video & { id: string })[]> => {
  try {
    const q = query(collection(db, "videos"), orderBy("likes", "desc"), limit(6));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video & { id: string }));
  } catch (error) {
    return [];
  }
};

export const getFreeVideos = async (): Promise<(Video & { id: string })[]> => {
  try {
    const q = query(collection(db, "videos"), where("price", "==", 0), limit(6));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video & { id: string }));
  } catch (error) {
    return [];
  }
};