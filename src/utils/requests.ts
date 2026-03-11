import { collection, query, orderBy, limit, getDocs, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Request, RequestStatus } from "../types/request";

export const getPreviewRequests = async (): Promise<any[]> => {
  try {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(4));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const getAllRequestsForAdmin = async () => {
  try {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request & { id: string }));

    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        let requesterName = "Pengguna Tidak Diketahui";
        let takerName = "-";

        if (req.requesterId) {
          const userSnap = await getDoc(doc(db, "users", req.requesterId));
          if (userSnap.exists()) {
            requesterName = userSnap.data().name || userSnap.data().email.split('@')[0];
          }
        }

        if (req.takerId) {
          const takerSnap = await getDoc(doc(db, "users", req.takerId));
          if (takerSnap.exists()) {
            takerName = takerSnap.data().name || takerSnap.data().email.split('@')[0];
          }
        }

        return {
          ...req,
          requesterName,
          takerName
        };
      })
    );

    return enrichedRequests;
  } catch (error) {
    return [];
  }
};

export const deleteRequestAdmin = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "requests", id));
  } catch (error) {
    throw new Error("Gagal menghapus request");
  }
};

export const updateRequestStatus = async (id: string, status: RequestStatus): Promise<void> => {
  try {
    await updateDoc(doc(db, "requests", id), { status });
  } catch (error) {
    throw new Error("Gagal mengubah status request");
  }
};