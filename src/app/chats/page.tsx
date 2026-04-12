"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  ArrowLeft,
  Clock,
  CheckCheck,
} from "lucide-react";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { subscribeToUserChats, getUserInfo } from "../../utils/chats";
import { Chat } from "../../types/chat";

type EnrichedChat = Chat & {
  id: string;
  otherUser: { name: string; avatar?: string; email: string } | null;
};

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7)
    return date.toLocaleDateString("id-ID", { weekday: "short" });
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function ChatsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<EnrichedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubChats = subscribeToUserChats(currentUser.uid, async (rawChats) => {
      // Enrich setiap chat dengan info user lawan bicara
      const enriched = await Promise.all(
        rawChats.map(async (chat) => {
          const otherId = chat.participants.find((p) => p !== currentUser.uid);
          const otherUser = otherId ? await getUserInfo(otherId) : null;
          return { ...chat, otherUser };
        })
      );
      setChats(enriched);
      setLoading(false);
    });

    return () => unsubChats();
  }, [currentUser]);

  const filtered = chats.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.otherUser?.name.toLowerCase().includes(q) ||
      c.otherUser?.email.toLowerCase().includes(q) ||
      c.lastMessage?.text.toLowerCase().includes(q)
    );
  });

  const totalUnread = chats.reduce((sum, c) => {
    return sum + (currentUser ? c.unreadCount?.[currentUser.uid] || 0 : 0);
  }, 0);

  if (!currentUser && !loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* bg blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-violet-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 leading-none">
                  Pesan
                </h1>
                {totalUnread > 0 && (
                  <p className="text-xs font-bold text-indigo-500 mt-0.5">
                    {totalUnread} pesan belum dibaca
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="relative mb-6"
        >
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white/80 backdrop-blur-md border border-white shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium text-slate-800 placeholder:text-slate-400"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
        </motion.div>

        {/* Chat list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white/80 rounded-[1.5rem] p-4 flex gap-4 animate-pulse"
              >
                <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white shadow-sm"
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {searchQuery ? "Percakapan Tidak Ditemukan" : "Belum Ada Percakapan"}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {searchQuery
                ? "Coba kata kunci lain."
                : "Kunjungi profil kreator dan mulai chat pertamamu!"}
            </p>
            {!searchQuery && (
              <Link
                href="/explore"
                className="inline-flex mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors"
              >
                Explore Kreator
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((chat, i) => {
                const unread = currentUser
                  ? chat.unreadCount?.[currentUser.uid] || 0
                  : 0;
                const isMyLastMsg =
                  chat.lastMessage?.senderId === currentUser?.uid;

                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <Link href={`/chats/${chat.id}`}>
                      <div
                        className={`flex items-center gap-4 p-4 rounded-[1.5rem] transition-all cursor-pointer group ${
                          unread > 0
                            ? "bg-indigo-50/80 border border-indigo-100 hover:bg-indigo-100/60"
                            : "bg-white/80 border border-white hover:bg-slate-50/80"
                        } backdrop-blur-md shadow-sm hover:shadow-md`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                            {chat.otherUser?.avatar ? (
                              <img
                                src={chat.otherUser.avatar}
                                alt={chat.otherUser.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              chat.otherUser?.name?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          {unread > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                              {unread > 9 ? "9+" : unread}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p
                              className={`font-bold truncate ${
                                unread > 0
                                  ? "text-slate-900"
                                  : "text-slate-800"
                              }`}
                            >
                              {chat.otherUser?.name || "Pengguna"}
                            </p>
                            <span className="text-[11px] font-medium text-slate-400 shrink-0 ml-2">
                              {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isMyLastMsg && (
                              <CheckCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            )}
                            <p
                              className={`text-sm truncate ${
                                unread > 0
                                  ? "font-semibold text-slate-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {chat.lastMessage
                                ? chat.lastMessage.text
                                : "Mulai percakapan..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}