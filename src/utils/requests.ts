import { collection, query, where, orderBy, limit, getDocs, doc, addDoc, serverTimestamp, Timestamp, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Request, RequestStatus } from "../types/request";
import { buyMaterial } from "./purchases";

export const getPreviewRequests = async (): Promise<any[]> => {
    try {
        const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(4));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        return [];
    }
};

export const getRequestById = async (id: string) => {
    try {
        const docRef = doc(db, "requests", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const reqData = docSnap.data();
        let requesterName = "Mahasiswa";

        if (reqData.requesterId) {
            const userRef = doc(db, "users", reqData.requesterId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                requesterName = userSnap.data().name || userSnap.data().email.split('@')[0];
            }
        }

        return {
            id: docSnap.id,
            ...reqData,
            requesterName
        };
    } catch (error) {
        return null;
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

export const getOpenRequests = async () => {
    try {
        const q = query(
            collection(db, "requests"),
            where("status", "==", "open"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request & { id: string }));

        const enrichedRequests = await Promise.all(
            requests.map(async (req) => {
                let requesterName = "Mahasiswa";

                if (req.requesterId) {
                    const userRef = doc(db, "users", req.requesterId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        requesterName = userSnap.data().name || userSnap.data().email.split('@')[0];
                    }
                }

                return {
                    ...req,
                    requesterName
                };
            })
        );

        return enrichedRequests;
    } catch (error) {
        return [];
    }
};

export const takeRequest = async (requestId: string, takerId: string) => {
    try {
        const requestRef = doc(db, "requests", requestId);
        await updateDoc(requestRef, {
            takerId: takerId,
            status: "taken"
        });
        return true;
    } catch (error) {
        throw new Error("Gagal mengambil request ini");
    }
};

export const createRequest = async (
    title: string,
    description: string,
    reward: number,
    requesterId: string,
    deadlineString?: string
) => {
    try {
        let deadlineDate = null;
        if (deadlineString) {
            deadlineDate = Timestamp.fromDate(new Date(deadlineString));
        }

        await addDoc(collection(db, "requests"), {
            title,
            description,
            reward,
            requesterId,
            takerId: null,
            materialId: null,
            type: null,
            status: "open",
            deadline: deadlineDate,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        throw new Error("Gagal membuat request");
    }
};

export const getMyCreatedRequests = async (userId: string) => {
    try {
        const q = query(collection(db, "requests"), where("requesterId", "==", userId));
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        return requests.sort((a, b) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    } catch (error) {
        return [];
    }
};

export const getMyTakenRequests = async (userId: string) => {
    try {
        const q = query(collection(db, "requests"), where("takerId", "==", userId));
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        return requests.sort((a, b) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    } catch (error) {
        return [];
    }
};

export const approveRequest = async (requestId: string) => {
    try {
        const reqRef = doc(db, "requests", requestId);
        const reqSnap = await getDoc(reqRef);

        if (!reqSnap.exists()) {
            throw new Error("Request tidak ditemukan");
        }

        const reqData = reqSnap.data();

        await updateDoc(reqRef, {
            status: "done"
        });

        if (reqData.reward > 0 && reqData.materialId && reqData.takerId) {
            await buyMaterial(
                reqData.requesterId,
                reqData.takerId,
                "video",
                reqData.materialId,
                reqData.reward
            );
        }

        return true;
    } catch (error) {
        throw error;
    }
};

export const addRequestComment = async (requestId: string, message: string) => {
    try {
        const reqRef = doc(db, "requests", requestId);
        await updateDoc(reqRef, {
            message: message
        });
        return true;
    } catch (error) {
        throw error;
    }
};