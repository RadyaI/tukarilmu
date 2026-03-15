import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query, where } from "firebase/firestore";
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
    const [videosSnap, postsSnap] = await Promise.all([
      getDocs(query(collection(db, "videos"), where("userId", "==", userId))),
      getDocs(query(collection(db, "posts"), where("userId", "==", userId))),
    ]);

    const totalUpload = videosSnap.size + postsSnap.size;

    const totalLikes = [
      ...videosSnap.docs.map(d => d.data().likes ?? 0),
      ...postsSnap.docs.map(d => d.data().likes ?? 0),
    ].reduce((sum, val) => sum + val, 0);

    if (tag === "Mahasiswa Aktif") {
      if (totalUpload < 10) {
        throw new Error(
          `Gagal! User baru upload ${totalUpload} konten. Minimal 10 video/post untuk jadi Mahasiswa Aktif.`
        );
      }
    }

    if (tag === "Mahasiswa Super") {
      if (totalUpload < 10) {
        throw new Error(
          `Gagal! User baru upload ${totalUpload} konten. Minimal 10 video/post untuk jadi Mahasiswa Super.`
        );
      }
      if (totalLikes <= 100) {
        throw new Error(
          `Gagal! Total likes user baru ${totalLikes}. Harus lebih dari 100 untuk jadi Mahasiswa Super.`
        );
      }
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { tag });
  } catch (error: any) {
    throw new Error(error.message || "Gagal mengubah tag user");
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