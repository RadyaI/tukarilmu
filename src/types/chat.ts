import { Timestamp } from "firebase/firestore";

export type UserId = string;
export type ChatId = string;
export type MessageId = string;

export interface Chat {
    id: ChatId;
    participants: UserId[];

    lastMessage?: {
        text: string;
        senderId: UserId;
        createdAt: Timestamp;
    };

    unreadCount?: Record<UserId, number>;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Message {
    id: MessageId;
    chatId: ChatId;

    senderId: UserId;
    text: string;

    createdAt: Timestamp;

    readBy?: UserId[];
}