"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  CheckCheck,
  Check,
} from "lucide-react";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getOrCreateChat,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  getUserInfo,
} from "../../../utils/chats";
import { Message, Chat } from "../../../types/chat";

function formatMsgTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday =
    date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.toDateString() === yesterday.toDateString();

  if (isToday) return "Hari ini";
  if (isYesterday) return "Kemarin";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupByDate(messages: (Message & { id: string })[]) {
  const groups: { date: string; messages: (Message & { id: string })[] }[] = [];
  let currentDate = "";

  messages.forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentDate) {
      currentDate = label;
      groups.push({ date: label, messages: [] });
    }
    groups[groups.length - 1].messages.push(msg);
  });

  return groups;
}

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chat, setChat] = useState<(Chat & { id: string }) | null>(null);
  const [messages, setMessages] = useState<(Message & { id: string })[]>([]);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    avatar?: string;
    email: string;
  } | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!currentUser || !chatId) return;

    const init = async () => {
      try {
        const parts = chatId.split("-");
        const chatDoc = await getOrCreateChat(
          currentUser.uid,
          parts.filter((_, i) => i !== 0).join("-") 
        );

        const { doc: firestoreDoc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../../../config/firebase");
        const chatRef = firestoreDoc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          router.push("/chats");
          return;
        }

        const chatData = { id: chatSnap.id, ...chatSnap.data() } as Chat & { id: string };

        if (!chatData.participants.includes(currentUser.uid)) {
          router.push("/chats");
          return;
        }

        setChat(chatData);

        const otherId = chatData.participants.find(
          (p) => p !== currentUser.uid
        );
        if (otherId) {
          const info = await getUserInfo(otherId);
          setOtherUser(info);
        }

        setLoading(false);

        await markMessagesAsRead(chatId, currentUser.uid);
      } catch (err) {
        console.error(err);
        router.push("/chats");
      }
    };

    init();
  }, [currentUser, chatId, router]);

  useEffect(() => {
    if (!chatId || loading) return;

    const unsub = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => scrollToBottom(msgs.length < 20), 100);
    });

    return () => unsub();
  }, [chatId, loading, scrollToBottom]);

  useEffect(() => {
    if (currentUser && chatId && messages.length > 0) {
      markMessagesAsRead(chatId, currentUser.uid).catch(() => {});
    }
  }, [messages.length, chatId, currentUser]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !currentUser || !chat) return;

    setSending(true);
    const text = inputText.trim();
    setInputText("");

    try {
      await sendMessage(chatId, currentUser.uid, text, chat.participants);
    } catch (err) {
      setInputText(text); 
      console.error(err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupByDate(messages);

  if (!currentUser) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {}
      <div className="absolute top-0 left-[-5%] w-[35rem] h-[35rem] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-5%] w-[35rem] h-[35rem] bg-violet-100/30 rounded-full blur-[100px] pointer-events-none" />

      {}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/chats"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-indigo-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {loading ? (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="space-y-1.5">
                <div className="w-28 h-3.5 bg-slate-200 rounded animate-pulse" />
                <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-sm">
                {otherUser?.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  otherUser?.name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate text-sm leading-tight">
                  {otherUser?.name || "Pengguna"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {otherUser?.email}
                </p>
              </div>
            </div>
          )}

          {}
          {chat && !loading && (
            <Link
              href={`/user/${chat.participants.find((p) => p !== currentUser.uid)}`}
              className="shrink-0 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Lihat Profil
            </Link>
          )}
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="font-bold text-slate-700 mb-1">
                Mulai percakapan!
              </p>
              <p className="text-sm text-slate-400">
                Kirim pesan pertamamu ke{" "}
                <span className="font-semibold text-slate-600">
                  {otherUser?.name || "kreator ini"}
                </span>
              </p>
            </motion.div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-bold text-slate-400 px-3 py-1 bg-white/80 rounded-full border border-slate-100 shadow-sm">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Messages in group */}
                <div className="space-y-1.5">
                  {group.messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const isRead = msg.readBy?.includes(
                      chat?.participants.find((p) => p !== currentUser.uid) || ""
                    );

                    // Consecutive message grouping
                    const prevMsg = group.messages[idx - 1];
                    const isFirstInGroup =
                      !prevMsg || prevMsg.senderId !== msg.senderId;
                    const nextMsg = group.messages[idx + 1];
                    const isLastInGroup =
                      !nextMsg || nextMsg.senderId !== msg.senderId;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        {/* Avatar untuk pesan orang lain (hanya di pesan terakhir group) */}
                        {!isMe && (
                          <div className="w-8 mr-2 shrink-0 self-end">
                            {isLastInGroup ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-xs font-extrabold">
                                {otherUser?.avatar ? (
                                  <img
                                    src={otherUser.avatar}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  otherUser?.name?.[0]?.toUpperCase() || "?"
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div
                          className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                        >
                          <div
                            className={`px-4 py-2.5 shadow-sm ${
                              isMe
                                ? "bg-indigo-600 text-white"
                                : "bg-white/90 text-slate-800 border border-slate-100"
                            } ${
                              isMe
                                ? isFirstInGroup && isLastInGroup
                                  ? "rounded-[1.2rem] rounded-br-md"
                                  : isFirstInGroup
                                  ? "rounded-[1.2rem] rounded-br-md"
                                  : isLastInGroup
                                  ? "rounded-[1.2rem] rounded-tr-md rounded-br-md"
                                  : "rounded-[1.2rem] rounded-r-md"
                                : isFirstInGroup && isLastInGroup
                                ? "rounded-[1.2rem] rounded-bl-md"
                                : isFirstInGroup
                                ? "rounded-[1.2rem] rounded-bl-md"
                                : isLastInGroup
                                ? "rounded-[1.2rem] rounded-tl-md rounded-bl-md"
                                : "rounded-[1.2rem] rounded-l-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          </div>

                          {/* Time + read status (only on last message in group) */}
                          {isLastInGroup && (
                            <div
                              className={`flex items-center gap-1 mt-1 ${
                                isMe ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              <span className="text-[10px] text-slate-400">
                                {formatMsgTime(msg.createdAt)}
                              </span>
                              {isMe && (
                                <span className="text-[10px]">
                                  {isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Input ─── */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.3rem] px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  // Auto resize
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                rows={1}
                className="w-full bg-transparent resize-none focus:outline-none text-slate-800 font-medium text-sm placeholder:text-slate-400 max-h-[120px] overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
            </div>

            <motion.button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              whileTap={{ scale: 0.92 }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-md ${
                inputText.trim() && !sending
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            Enter untuk kirim · Shift+Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  );
}