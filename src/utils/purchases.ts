import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc, increment, orderBy, getAggregateFromServer, sum } from "firebase/firestore";
import { db } from "../config/firebase";
import { Purchase } from "../types/purchase";

const PLATFORM_FEE_PERCENTAGE = 0.10;

export const getUserPurchases = async (userId: string) => {
  try {
    const q = query(collection(db, "purchases"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase & { id: string }));

    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        const materialRef = doc(db, purchase.type === "video" ? "videos" : "posts", purchase.materialId);
        const materialSnap = await getDoc(materialRef);
        
        let materialData = null;
        let creatorName = "Kreator Tidak Diketahui";

        if (materialSnap.exists()) {
          materialData = materialSnap.data();
          if (materialData.userId) {
            const userRef = doc(db, "users", materialData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              creatorName = userSnap.data().name || userSnap.data().email.split('@')[0];
            }
          }
        }

        return {
          ...purchase,
          material: materialData ? { id: materialSnap.id, ...materialData } : null,
          creatorName
        };
      })
    );

    return enrichedPurchases.sort((a, b) => {
      const dateA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const dateB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
};

export const checkHasPurchased = async (userId: string, materialId: string): Promise<boolean> => {
  try {
    const purchaseQuery = query(
      collection(db, "purchases"),
      where("userId", "==", userId),
      where("materialId", "==", materialId)
    );
    const purchaseSnapshot = await getDocs(purchaseQuery);
    
    if (!purchaseSnapshot.empty) {
      return true;
    }

    const requestQuery = query(
      collection(db, "requests"),
      where("requesterId", "==", userId),
      where("materialId", "==", materialId)
    );
    const requestSnapshot = await getDocs(requestQuery);
    
    return !requestSnapshot.empty;
  } catch (error) {
    return false;
  }
};

export const buyMaterial = async (userId: string, creatorId: string, type: "video" | "post", materialId: string, price: number) => {
  try {
    let platformFee = 0;
    let netAmount = 0;

    if (price > 0) {
      platformFee = Math.round(price * PLATFORM_FEE_PERCENTAGE);
      netAmount = price - platformFee;
    }

    await addDoc(collection(db, "purchases"), {
      userId,
      creatorId,
      type,
      materialId,
      price,
      netAmount,
      platformFee,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error("Gagal melakukan pembelian");
  }
};

export const getAuthorInfo = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const incrementLike = async (type: "video" | "post", materialId: string) => {
  try {
    const docRef = doc(db, type === "video" ? "videos" : "posts", materialId);
    await updateDoc(docRef, {
      likes: increment(1)
    });
  } catch (error) {
    throw new Error("Gagal menyukai materi");
  }
};

export const getAllPurchasesForAdmin = async () => {
  try {
    const q = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase & { id: string }));

    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        let buyerName = "Pengguna Tidak Diketahui";
        let buyerEmail = "-";
        
        if (purchase.userId) {
          const userRef = doc(db, "users", purchase.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            buyerName = userSnap.data().name || userSnap.data().email.split('@')[0];
            buyerEmail = userSnap.data().email;
          }
        }

        let materialTitle = "Materi Telah Dihapus";
        
        if (purchase.materialId) {
          const materialRef = doc(db, purchase.type === "video" ? "videos" : "posts", purchase.materialId);
          const materialSnap = await getDoc(materialRef);
          if (materialSnap.exists()) {
            materialTitle = materialSnap.data().title;
          }
        }

        return {
          ...purchase,
          buyerName,
          buyerEmail,
          materialTitle
        };
      })
    );

    return enrichedPurchases;
  } catch (error) {
    return [];
  }
};

export const getCreatorRevenue = async (creatorId: string) => {
  try {
    const q = query(
      collection(db, "purchases"), 
      where("creatorId", "==", creatorId)
    );
    
    const snapshot = await getAggregateFromServer(q, {
      totalRevenue: sum('netAmount')
    });
    return snapshot.data().totalRevenue || 0;
  } catch (error) {
    return 0;
  }
};