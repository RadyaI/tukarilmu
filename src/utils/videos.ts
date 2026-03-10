import { collection, query, orderBy, limit, getDocs, where, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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

export const getVideoById = async (id: string): Promise<(Video & { id: string }) | null> => {
  try {
    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Video & { id: string };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const addVideoMetadata = async (videoData: Omit<Video, "createdAt" | "likes">) => {
  const docRef = await addDoc(collection(db, "videos"), {
    ...videoData,
    likes: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getUserVideos = async (userId: string): Promise<(Video & { id: string })[]> => {
  try {
    const q = query(collection(db, "videos"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video & { id: string }));
    return data.sort((a, b) => {
      const dateA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const dateB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
};

export const deleteVideo = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "videos", id));
  } catch (error) {
    throw new Error("Gagal menghapus video");
  }
};

export const updateVideoMetadata = async (id: string, videoData: Partial<Video>) => {
  try {
    const docRef = doc(db, "videos", id);
    await updateDoc(docRef, videoData);
  } catch (error) {
    throw new Error("Gagal memperbarui video");
  }
};