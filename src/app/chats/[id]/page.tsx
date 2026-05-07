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
  Reply,
  Trash2,
  X,
  CornerUpLeft,
} from "lucide-react";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getOrCreateChat,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  getUserInfo,
  deleteMessageForEveryone,
  deleteMessageForMe,
} from "../../../utils/chats";
import { Message, Chat } from "../../../types/chat";


interface ReplyTo {
  messageId: string;
  text: string;
  senderName: string;
}

interface MessageOption {
  msg: Message & { id: string };
  isMe: boolean;
}


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
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

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


function MessageOptionsModal({
  option,
  currentUserId,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: {
  option: MessageOption;
  currentUserId: string;
  onReply: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}) {
  const isSender = option.msg.senderId === currentUserId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl rounded-b-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm mx-4 mb-4 sm:mb-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          { }
          <div className="px-5 pt-5 pb-4 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pesan
            </p>
            <p className="text-sm font-medium text-slate-700 line-clamp-3 leading-relaxed">
              {option.msg.deletedForEveryone
                ? "Pesan ini telah dihapus"
                : option.msg.text}
            </p>
          </div>

          { }
          <div className="p-3 space-y-1">
            { }
            {!option.msg.deletedForEveryone && (
              <button
                onClick={onReply}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <Reply className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Balas</p>
                  <p className="text-xs text-slate-400 font-medium">Balas pesan ini</p>
                </div>
              </button>
            )}

            { }
            <button
              onClick={onDeleteForMe}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-orange-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                <Trash2 className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Hapus untuk saya</p>
                <p className="text-xs text-slate-400 font-medium">
                  Hanya hilang di perangkatmu
                </p>
              </div>
            </button>

            { }
            {isSender && !option.msg.deletedForEveryone && (
              <button
                onClick={onDeleteForEveryone}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-600">Hapus untuk semua</p>
                  <p className="text-xs text-slate-400 font-medium">
                    Dihapus dari semua perangkat
                  </p>
                </div>
              </button>
            )}
          </div>

          { }
          <div className="px-3 pb-3">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-600"
            >
              Batal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
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

  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<MessageOption | null>(null);

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
        await getOrCreateChat(
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

        const chatData = {
          id: chatSnap.id,
          ...chatSnap.data(),
        } as Chat & { id: string };

        if (!chatData.participants.includes(currentUser.uid)) {
          router.push("/chats");
          return;
        }

        setChat(chatData);

        const otherId = chatData.participants.find((p) => p !== currentUser.uid);
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
      markMessagesAsRead(chatId, currentUser.uid).catch(() => { });
    }
  }, [messages.length, chatId, currentUser]);


  const handleSend = async () => {
    if (!inputText.trim() || sending || !currentUser || !chat) return;

    setSending(true);
    const text = inputText.trim();
    setInputText("");
    const currentReply = replyTo;
    setReplyTo(null);

    try {
      await sendMessage(
        chatId,
        currentUser.uid,
        text,
        chat.participants,
        currentReply ?? undefined
      );
    } catch (err) {
      setInputText(text);
      setReplyTo(currentReply);
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

  const handleClickMessage = (
    msg: Message & { id: string },
    isMe: boolean
  ) => {
    setSelectedMsg({ msg, isMe });
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    const senderName =
      selectedMsg.isMe ? "Kamu" : otherUser?.name || "Pengguna";
    setReplyTo({
      messageId: selectedMsg.msg.id,
      text: selectedMsg.msg.text,
      senderName,
    });
    setSelectedMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMsg || !currentUser) return;
    setSelectedMsg(null);
    try {
      await deleteMessageForMe(chatId, selectedMsg.msg.id, currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMsg || !currentUser) return;
    setSelectedMsg(null);
    try {
      await deleteMessageForEveryone(
        chatId,
        selectedMsg.msg.id,
        selectedMsg.msg.senderId,
        currentUser.uid
      );
    } catch (err) {
      console.error(err);
    }
  };


  const visibleMessages = messages.filter(
    (msg) => !msg.deletedFor?.includes(currentUser?.uid)
  );

  const grouped = groupByDate(visibleMessages);

  if (!currentUser) return null;


  return (
    <div className="h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      { }
      <div className="absolute top-0 left-[-5%] w-[35rem] h-[35rem] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-5%] w-[35rem] h-[35rem] bg-violet-100/30 rounded-full blur-[100px] pointer-events-none" />

      { }
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm flex-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link
              href="/chats"
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-indigo-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-200 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-sm">
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
                  <p className="font-extrabold text-slate-900 truncate text-base leading-tight">
                    {otherUser?.name || "Pengguna"}
                  </p>
                  <p className="text-sm font-medium text-slate-500 truncate">
                    {otherUser?.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {chat && !loading && (
            <Link
              href={`/user/${chat.participants.find((p) => p !== currentUser.uid)}`}
              className="hidden sm:flex shrink-0 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Lihat Profil
            </Link>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full flex justify-center">
        <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : visibleMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-indigo-300" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                Mulai Percakapan!
              </h2>
              <p className="text-base font-medium text-slate-500 max-w-sm">
                Kirim pesan pertamamu untuk berdiskusi dengan{" "}
                <span className="font-bold text-slate-700">
                  {otherUser?.name || "kreator ini"}
                </span>
              </p>
            </motion.div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-8">
                  <span className="text-[11px] font-bold text-slate-500 px-4 py-1.5 bg-slate-100/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm uppercase tracking-wider">
                    {group.date}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const isRead = msg.readBy?.includes(
                      chat?.participants.find((p) => p !== currentUser.uid) || ""
                    );

                    const prevMsg = group.messages[idx - 1];
                    const isFirstInGroup =
                      !prevMsg || prevMsg.senderId !== msg.senderId;
                    const nextMsg = group.messages[idx + 1];
                    const isLastInGroup =
                      !nextMsg || nextMsg.senderId !== msg.senderId;

                    const isDeleted = !!msg.deletedForEveryone;

                    // Cari pesan yang di-reply
                    const repliedMsg = msg.replyTo
                      ? messages.find((m) => m.id === msg.replyTo?.messageId)
                      : null;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        {!isMe && (
                          <div className="w-10 mr-3 shrink-0 self-end mb-3 hidden sm:block">
                            {isLastInGroup && (
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-sm font-extrabold shadow-sm">
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
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"
                            }`}
                        >
                          {/* Reply preview di dalam bubble */}
                          {msg.replyTo && !isDeleted && (
                            <div
                              className={`w-full mb-1 px-1 ${isMe ? "flex justify-end" : "flex justify-start"
                                }`}
                            >
                              <div
                                className={`flex items-start gap-2 px-3 py-2 rounded-xl max-w-[90%] ${isMe
                                  ? "bg-indigo-500/20 border border-indigo-300/40"
                                  : "bg-slate-100 border border-slate-200"
                                  }`}
                              >
                                <CornerUpLeft
                                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isMe ? "text-indigo-v" : "text-slate-400"
                                    }`}
                                />
                                <div className="min-w-0">
                                  {/* <p
                                    className={`text-[11px] font-bold mb-0.5 ${
                                      isMe ? "text-indigo-700" : "text-indigo-600"
                                    }`}
                                  >
                                    {msg.replyTo.senderName}
                                  </p> */}
                                  <p
                                    className={`text-xs font-medium truncate ${isMe ? "text-indigo-700/80" : "text-slate-500"
                                      }`}
                                  >
                                    {repliedMsg?.deletedForEveryone
                                      ? "Pesan telah dihapus"
                                      : msg.replyTo.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bubble utama */}
                          <div
                            onClick={() =>
                              !isDeleted && handleClickMessage(msg, isMe)
                            }
                            className={`px-5 py-3 shadow-sm cursor-pointer transition-opacity active:opacity-70 ${isDeleted ? "opacity-60 cursor-default" : ""
                              } ${isMe
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-slate-800 border border-slate-100"
                              } ${isMe
                                ? isFirstInGroup && isLastInGroup
                                  ? "rounded-2xl rounded-br-sm"
                                  : isFirstInGroup
                                    ? "rounded-2xl rounded-br-sm"
                                    : isLastInGroup
                                      ? "rounded-2xl rounded-tr-sm rounded-br-sm"
                                      : "rounded-2xl rounded-r-sm"
                                : isFirstInGroup && isLastInGroup
                                  ? "rounded-2xl rounded-bl-sm"
                                  : isFirstInGroup
                                    ? "rounded-2xl rounded-bl-sm"
                                    : isLastInGroup
                                      ? "rounded-2xl rounded-tl-sm rounded-bl-sm"
                                      : "rounded-2xl rounded-l-sm"
                              }`}
                          >
                            {isDeleted ? (
                              <p className="text-sm font-medium italic opacity-60 flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" />
                                Pesan telah dihapus
                              </p>
                            ) : (
                              <p className="text-base font-medium leading-relaxed whitespace-pre-wrap break-all">
                                {msg.text}
                              </p>
                            )}
                          </div>

                          {isLastInGroup && (
                            <div
                              className={`flex items-center gap-1.5 mb-4 mt-1.5 px-1 ${isMe ? "flex-row-reverse" : "flex-row"
                                }`}
                            >
                              <span className="text-xs font-semibold text-slate-400">
                                {formatMsgTime(msg.createdAt)}
                              </span>
                              {isMe && (
                                <span className="text-xs">
                                  {isRead ? (
                                    <CheckCheck className="w-4 h-4 text-indigo-500" />
                                  ) : (
                                    <Check className="w-4 h-4 text-slate-300" />
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

      {/* ── Input area ── */}
      <div className="relative z-10 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] flex-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

          {/* Reply preview bar */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-3 mb-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl"
              >
                <CornerUpLeft className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-600 mb-0.5">
                    Membalas {replyTo.senderName}
                  </p>
                  <p className="text-xs font-medium text-slate-500 truncate">
                    {replyTo.text}
                  </p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 sm:gap-4">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-3.5 sm:py-4 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 150) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                rows={1}
                className="w-full bg-transparent resize-none focus:outline-none text-slate-800 font-medium text-base placeholder:text-slate-400 max-h-[150px] overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
            </div>

            <motion.button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              whileTap={{ scale: 0.92 }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 transition-all shadow-md cursor-pointer ${inputText.trim() && !sending
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
            >
              {sending ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />
              )}
            </motion.button>
          </div>

          <p className="text-xs font-semibold text-slate-400 text-center mt-3 hidden sm:block">
            Tekan{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-sans border border-slate-200">
              Enter
            </kbd>{" "}
            untuk kirim ·{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-sans border border-slate-200">
              Shift
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-sans border border-slate-200">
              Enter
            </kbd>{" "}
            untuk baris baru
          </p>
        </div>
      </div>

      {/* ── Modal opsi pesan ── */}
      {selectedMsg && (
        <MessageOptionsModal
          option={selectedMsg}
          currentUserId={currentUser.uid}
          onReply={handleReply}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onClose={() => setSelectedMsg(null)}
        />
      )}
    </div>
  );
}