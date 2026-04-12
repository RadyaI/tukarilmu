"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  ArrowLeft,
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-24">
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-violet-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Pesan
                </h1>
                {totalUnread > 0 ? (
                  <p className="text-sm font-bold text-indigo-500 mt-1">
                    {totalUnread} pesan belum dibaca
                  </p>
                ) : (
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Kelola obrolan dengan kreator lain
                  </p>
                )}
              </div>
            </div>

            <div className="relative w-full md:w-[22rem] shrink-0">
              <input
                type="text"
                placeholder="Cari percakapan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium text-slate-800 placeholder:text-slate-400"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
        >
          {loading ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="p-4 sm:p-6 flex items-center gap-4 animate-pulse bg-white"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {searchQuery ? "Percakapan Tidak Ditemukan" : "Belum Ada Percakapan"}
              </h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                {searchQuery
                  ? "Coba gunakan kata kunci lain untuk mencari percakapan."
                  : "Kunjungi profil kreator di halaman Explore dan mulai chat pertamamu sekarang!"}
              </p>
              {!searchQuery && (
                <Link
                  href="/explore"
                  className="inline-flex mt-8 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Explore Kreator
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 bg-white">
              <AnimatePresence>
                {filtered.map((chat) => {
                  const unread = currentUser
                    ? chat.unreadCount?.[currentUser.uid] || 0
                    : 0;
                  const isMyLastMsg =
                    chat.lastMessage?.senderId === currentUser?.uid;

                  return (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Link href={`/chats/${chat.id}`}>
                        <div
                          className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-6 transition-all cursor-pointer hover:bg-slate-50 group ${
                            unread > 0 ? "bg-indigo-50/30" : "bg-white"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
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
                          </div>

                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <p
                                className={`font-bold truncate text-base sm:text-md transition-colors group-hover:text-indigo-600 ${
                                  unread > 0
                                    ? "text-slate-900"
                                    : "text-slate-800"
                                }`}
                              >
                                {chat.otherUser?.name || "Pengguna"}
                              </p>
                              <span className={`text-[10px] sm:text-xs shrink-0 ml-4 ${
                                unread > 0 ? "font-bold text-indigo-600" : "font-medium text-slate-400"
                              }`}>
                                {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isMyLastMsg && (
                                  <CheckCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                )}
                                <p
                                  className={`text-[14px] sm:text-md truncate ${
                                    unread > 0
                                      ? "font-bold text-slate-800"
                                      : "font-medium text-slate-500"
                                  }`}
                                >
                                  {chat.lastMessage
                                    ? chat.lastMessage.text
                                    : "Mulai percakapan..."}
                                </p>
                              </div>
                              
                              {unread > 0 && (
                                <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-indigo-600 text-white text-[11px] sm:text-xs font-extrabold rounded-full flex items-center justify-center shadow-sm">
                                  {unread > 9 ? "9+" : unread}
                                </div>
                              )}
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
        </motion.div>
      </div>
    </div>
  );
}