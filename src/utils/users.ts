import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query } from "firebase/firestore";
import { db } from "../config/firebase";
import { User, UserRole, UserTag } from "../types/user";

export const getAllUsers = async (): Promise<(User & { id: string, banned?: boolean })[]> => {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User & { id: string, banned?: boolean }));
  } catch (error) {
    return [];
  }
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role });
  } catch (error) {
    throw new Error("Gagal mengubah role user");
  }
};

export const updateUserTag = async (userId: string, tag: UserTag) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { tag });
  } catch (error) {
    throw new Error("Gagal mengubah tag user");
  }
};

export const toggleBanUser = async (userId: string, isBanned: boolean) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { banned: isBanned });
  } catch (error) {
    throw new Error("Gagal mengubah status blokir user");
  }
};

export const deleteUserDoc = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  } catch (error) {
    throw new Error("Gagal menghapus data user dari database");
  }
};