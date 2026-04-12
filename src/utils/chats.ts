import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Chat, Message } from "../types/chat";

export const buildChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join("-");
};

export const getOrCreateChat = async (
  currentUserId: string,
  otherUserId: string
): Promise<Chat & { id: string }> => {
  const chatId = buildChatId(currentUserId, otherUserId);
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    return { id: chatSnap.id, ...(chatSnap.data() as Chat) };
  }

  const now = Timestamp.now();
  const newChat: Omit<Chat, "id"> = {
    participants: [currentUserId, otherUserId],
    unreadCount: {
      [currentUserId]: 0,
      [otherUserId]: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(chatRef, newChat);
  return { id: chatId, ...newChat };
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  text: string,
  participantIds: string[]
): Promise<void> => {
  if (!text.trim()) return;

  const messagesRef = collection(db, "chats", chatId, "messages");
  const now = Timestamp.now();

  await addDoc(messagesRef, {
    chatId,
    senderId,
    text: text.trim(),
    createdAt: now,
    readBy: [senderId],
  });

  const chatRef = doc(db, "chats", chatId);
  const unreadUpdate: Record<string, any> = {};
  participantIds.forEach((uid) => {
    if (uid !== senderId) {
      unreadUpdate[`unreadCount.${uid}`] = increment(1);
    }
  });

  await updateDoc(chatRef, {
    lastMessage: {
      text: text.trim(),
      senderId,
      createdAt: now,
    },
    updatedAt: now,
    ...unreadUpdate,
  });
};

export const markMessagesAsRead = async (
  chatId: string,
  currentUserId: string
): Promise<void> => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${currentUserId}`]: 0,
    });

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, where("senderId", "!=", currentUserId));
    const snap = await getDocs(q);

    const updates = snap.docs
      .filter((d) => {
        const data = d.data();
        return !data.readBy?.includes(currentUserId);
      })
      .map((d) =>
        updateDoc(d.ref, {
          readBy: arrayUnion(currentUserId),
        })
      );

    await Promise.all(updates);
  } catch (err) {
    console.error("markMessagesAsRead error:", err);
  }
};

export const subscribeToUserChats = (
  userId: string,
  callback: (chats: (Chat & { id: string })[]) => void
) => {
  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Chat),
    }));
    callback(chats);
  });
};

export const subscribeToMessages = (
  chatId: string,
  callback: (messages: (Message & { id: string })[]) => void
) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Message),
    }));
    callback(messages);
  });
};

export const getUserInfo = async (
  userId: string
): Promise<{ name: string; avatar?: string; email: string } | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        name: data.name || data.email?.split("@")[0] || "Pengguna",
        avatar: data.avatar,
        email: data.email,
      };
    }
    return null;
  } catch {
    return null;
  }
};