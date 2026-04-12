import { Timestamp } from "firebase/firestore";

export type UserId = string;
export type ChatId = string;
export type MessageId = string;

export interface Chat {
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

export interface ReplyTo {
  messageId: MessageId;
  text: string;
  senderName: string;
}

export interface Message {
  chatId: ChatId;

  senderId: UserId;
  text: string;

  createdAt: Timestamp;

  readBy?: UserId[];

  replyTo?: ReplyTo;

  deletedForEveryone?: boolean;  
  deletedFor?: UserId[];         
}

export type ChatWithId = Chat & { id: ChatId };
export type MessageWithId = Message & { id: MessageId };