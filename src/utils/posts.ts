import { collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { Post } from "../types/post";

export const getPopularPosts = async (): Promise<(Post & { id: string })[]> => {
  try {
    const q = query(collection(db, "posts"), orderBy("likes", "desc"), limit(6));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post & { id: string }));
  } catch (error) {
    return [];
  }
};

export const getFreePosts = async (): Promise<(Post & { id: string })[]> => {
  try {
    const q = query(collection(db, "posts"), where("price", "==", 0), limit(6));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post & { id: string }));
  } catch (error) {
    return [];
  }
};

export const addPostMetadata = async (postData: Omit<Post, "createdAt" | "likes">) => {
  const docRef = await addDoc(collection(db, "posts"), {
    ...postData,
    likes: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getUserPosts = async (userId: string): Promise<(Post & { id: string })[]> => {
  try {
    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post & { id: string }));
    return data.sort((a, b) => {
      const dateA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const dateB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
};

export const deletePost = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "posts", id));
  } catch (error) {
    throw new Error("Gagal menghapus post");
  }
};

export const getPostById = async (id: string): Promise<(Post & { id: string }) | null> => {
  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post & { id: string };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const updatePostMetadata = async (id: string, postData: Partial<Post>) => {
  try {
    const docRef = doc(db, "posts", id);
    await updateDoc(docRef, postData);
  } catch (error) {
    throw new Error("Gagal memperbarui post");
  }
};