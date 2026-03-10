import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export const getPreviewRequests = async (): Promise<any[]> => {
  try {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(4));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};