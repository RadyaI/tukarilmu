"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  GraduationCap,
  Star,
  BookOpen,
  Instagram,
  Linkedin,
  Globe,
  ChevronDown,
  Sparkles,
  X,
  Building2,
  Hash,
  Calendar,
  Heart,
  FileText,
  Video,
  TrendingUp,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getAllUsers } from "../../utils/users";
import { buildChatId } from "../../utils/chats";
import { User, UserTag } from "../../types/user";
import { JURUSAN_LIST } from "../../types/jurusan";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TutorStats {
  totalVideos: number;
  totalPosts: number;
  totalLikes: number;
}

interface TutorWithStats extends User {
  id: string;
  stats: TutorStats;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TAG_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: string;
  avatarGradient: string; btnClass: string; accentBar: string;
}> = {
  "Mahasiswa Aktif": {
    label: "Mahasiswa Aktif", color: "text-emerald-700",
    bg: "bg-emerald-50", border: "border-emerald-200", icon: "⚡",
    avatarGradient: "from-indigo-400 to-violet-600",
    btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 hover:shadow-indigo-200",
    accentBar: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  "Mahasiswa Super": {
    label: "Mahasiswa Super", color: "text-amber-700",
    bg: "bg-amber-50", border: "border-amber-200", icon: "🏆",
    avatarGradient: "from-amber-400 to-orange-500",
    btnClass: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-100 hover:shadow-amber-200",
    accentBar: "from-amber-400 via-orange-400 to-yellow-300",
  },
};

const VERIFIED_TAGS: UserTag[] = ["Mahasiswa Aktif", "Mahasiswa Super"];
const FILTER_TAGS = ["Semua", "Mahasiswa Aktif", "Mahasiswa Super"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

async function fetchTutorStats(userId: string): Promise<TutorStats> {
  const [videosSnap, postsSnap] = await Promise.all([
    getDocs(query(collection(db, "videos"), where("userId", "==", userId))),
    getDocs(query(collection(db, "posts"), where("userId", "==", userId))),
  ]);
  const totalLikes = [
    ...videosSnap.docs.map((d) => d.data().likes ?? 0),
    ...postsSnap.docs.map((d) => d.data().likes ?? 0),
  ].reduce((sum, val) => sum + val, 0);
  return { totalVideos: videosSnap.size, totalPosts: postsSnap.size, totalLikes };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TutorModal({ tutor, currentUserId, onChat, onClose }: {
  tutor: TutorWithStats;
  currentUserId: string | null;
  onChat: (id: string) => void;
  onClose: () => void;
}) {
  const [avatarError, setAvatarError] = useState(false);
  const tag = TAG_CONFIG[tutor.tag];
  const isOwnCard = currentUserId === tutor.userId;
  const { stats } = tutor;
  const totalContent = stats.totalVideos + stats.totalPosts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar top */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${tag?.accentBar ?? "from-slate-300 to-slate-400"}`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        <div className="overflow-y-auto max-h-[85vh]">
          {/* Header */}
          <div className="flex flex-col items-center text-center px-6 pt-7 pb-5 border-b border-slate-100">
            <div className="relative mb-4">
              {tutor.avatar && !avatarError ? (
                <img src={tutor.avatar} alt={tutor.name} onError={() => setAvatarError(true)}
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-lg" />
              ) : (
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-2xl ring-4 ring-white shadow-lg bg-gradient-to-br ${tag?.avatarGradient ?? "from-slate-400 to-slate-600"}`}>
                  {getInitials(tutor.name)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
            </div>
            <h2 className="font-black text-slate-900 text-xl leading-snug mb-2">{tutor.name}</h2>
            {tag && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${tag.bg} ${tag.color} ${tag.border} mb-1`}>
                {tag.icon} {tag.label}
              </span>
            )}
            <p className="text-xs font-medium text-slate-400 mt-1">{tutor.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col items-center py-3.5 px-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-base font-black text-slate-800">{formatNumber(stats.totalVideos)}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Video</span>
            </div>
            <div className="flex flex-col items-center py-3.5 px-2">
              <div className="flex items-center gap-1 mb-0.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-base font-black text-slate-800">{formatNumber(stats.totalPosts)}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Post</span>
            </div>
            <div className="flex flex-col items-center py-3.5 px-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-base font-black text-slate-800">{formatNumber(stats.totalLikes)}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Likes</span>
            </div>
          </div>

          {/* Detail info */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jurusan</p>
                <p className={`text-sm font-bold ${tutor.jurusan ? "text-slate-700" : "text-slate-300 italic"}`}>
                  {tutor.jurusan ?? "Belum diisi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kampus</p>
                <p className={`text-sm font-bold ${tutor.kampus ? "text-slate-700" : "text-slate-300 italic"}`}>
                  {tutor.kampus ?? "Belum diisi"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2.5 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Semester</p>
                  <p className={`text-sm font-black ${tutor.semester ? "text-slate-700" : "text-slate-300 italic"}`}>
                    {tutor.semester ? `Sem. ${tutor.semester}` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Angkatan</p>
                  <p className={`text-sm font-black ${tutor.angkatan ? "text-slate-700" : "text-slate-300 italic"}`}>
                    {tutor.angkatan ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl px-3 py-2.5 border border-indigo-100/60">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Total Kontribusi</p>
                <p className="text-sm font-black text-indigo-700">
                  {totalContent} konten · {formatNumber(stats.totalLikes)} likes
                </p>
              </div>
            </div>

            {tutor.bio ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Bio</p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{tutor.bio}</p>
              </div>
            ) : (
              <div className="px-3 py-2.5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-xs font-medium text-slate-300 italic">Bio belum diisi</p>
              </div>
            )}

            {(tutor.igUrl || tutor.linkedinUrl || tutor.portfolioUrl) && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">Sosmed</p>
                {tutor.igUrl && (
                  <a href={tutor.igUrl} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-pink-50 hover:bg-pink-100 flex items-center justify-center transition-colors">
                    <Instagram className="w-4 h-4 text-pink-500" />
                  </a>
                )}
                {tutor.linkedinUrl && (
                  <a href={tutor.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  </a>
                )}
                {tutor.portfolioUrl && (
                  <a href={tutor.portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <Globe className="w-4 h-4 text-slate-500" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            {!isOwnCard ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onChat(tutor.userId); onClose(); }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${tag?.btnClass ?? "bg-indigo-600 text-white"}`}
              >
                <MessageCircle className="w-4 h-4" />
                Mulai Chat
              </motion.button>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-slate-50 text-slate-400 border border-slate-100">
                <Star className="w-4 h-4" />
                Profil Kamu
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function TutorCard({ tutor, currentUserId, onChat, onOpenModal, index }: {
  tutor: TutorWithStats;
  currentUserId: string | null;
  onChat: (id: string) => void;
  onOpenModal: (tutor: TutorWithStats) => void;
  index: number;
}) {
  const [avatarError, setAvatarError] = useState(false);
  const tag = TAG_CONFIG[tutor.tag];
  const isOwnCard = currentUserId === tutor.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onOpenModal(tutor)}
      className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${tag?.accentBar ?? "from-slate-300 to-slate-400"}`} />

      <div className="p-5 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {tutor.avatar && !avatarError ? (
            <img src={tutor.avatar} alt={tutor.name} onError={() => setAvatarError(true)}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md" />
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-lg ring-4 ring-white shadow-md bg-gradient-to-br ${tag?.avatarGradient ?? "from-slate-400 to-slate-600"}`}>
              {getInitials(tutor.name)}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-base leading-snug mb-1 truncate">{tutor.name}</h3>
          {tag && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tag.bg} ${tag.color} ${tag.border} mb-1.5`}>
              {tag.icon} {tag.label}
            </span>
          )}
          <p className={`text-xs font-semibold truncate ${tutor.jurusan ? "text-slate-500" : "text-slate-300 italic"}`}>
            <GraduationCap className="w-3 h-3 inline mr-1 text-indigo-400" />
            {tutor.jurusan ?? "Jurusan belum diisi"}
          </p>
          <p className={`text-xs font-semibold truncate mt-0.5 ${tutor.kampus ? "text-slate-500" : "text-slate-300 italic"}`}>
            <Building2 className="w-3 h-3 inline mr-1 text-violet-400" />
            {tutor.kampus ?? "Kampus belum diisi"}
          </p>
        </div>

        {/* Tombol Chat — stopPropagation biar ga trigger modal */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isOwnCard ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChat(tutor.userId)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${tag?.btnClass ?? "bg-indigo-600 text-white"}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </motion.button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-50 text-slate-400 border border-slate-100">
              <Star className="w-3.5 h-3.5" />
              Kamu
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TutorsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tutors, setTutors] = useState<TutorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Semua");
  const [activeJurusan, setActiveJurusan] = useState("Semua");
  const [jurusanOpen, setJurusanOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<TutorWithStats | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await getAllUsers();
      const verified = all.filter((u) => VERIFIED_TAGS.includes(u.tag as UserTag));
      const withStats = await Promise.all(
        verified.map(async (u) => {
          const stats = await fetchTutorStats(u.userId);
          return { ...u, stats } as TutorWithStats;
        })
      );
      withStats.sort((a, b) => {
        if (a.tag === "Mahasiswa Super" && b.tag !== "Mahasiswa Super") return -1;
        if (a.tag !== "Mahasiswa Super" && b.tag === "Mahasiswa Super") return 1;
        return b.stats.totalLikes - a.stats.totalLikes;
      });
      setTutors(withStats);
      setLoading(false);
    };
    load();
  }, []);

  const handleChat = (tutorId: string) => {
    if (!currentUser) { router.push("/login"); return; }
    router.push(`/chats/${buildChatId(currentUser.uid, tutorId)}`);
  };

  const filtered = tutors.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      t.name.toLowerCase().includes(q) ||
      (t.jurusan ?? "").toLowerCase().includes(q) ||
      (t.kampus ?? "").toLowerCase().includes(q);
    return matchSearch && (activeTag === "Semua" || t.tag === activeTag) &&
      (activeJurusan === "Semua" || t.jurusan === activeJurusan);
  });

  const superCount = tutors.filter((t) => t.tag === "Mahasiswa Super").length;
  const aktifCount = tutors.filter((t) => t.tag === "Mahasiswa Aktif").length;
  const totalLikesAll = tutors.reduce((sum, t) => sum + t.stats.totalLikes, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest">Komunitas Terbaik</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 leading-tight">
              Tutor & Kreator<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Terverifikasi</span>
            </h1>
            <p className="text-base font-medium text-slate-500 max-w-xl mb-8">
              Temukan mahasiswa berprestasi yang siap berbagi ilmu dan pengalaman. Chat langsung dan mulai belajar sekarang!
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: "🏆", label: "Mahasiswa Super", value: superCount, color: "amber" },
                { icon: "⚡", label: "Mahasiswa Aktif", value: aktifCount, color: "emerald" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className={`flex items-center gap-2.5 bg-${color}-50 border border-${color}-100 rounded-2xl px-4 py-3`}>
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className={`text-[10px] font-bold text-${color}-600 uppercase tracking-wide`}>{label}</p>
                    <p className={`text-2xl font-black text-${color}-700 leading-none`}>{value}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
                <Heart className="w-5 h-5 text-rose-400" />
                <div>
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Total Likes</p>
                  <p className="text-2xl font-black text-rose-600 leading-none">{formatNumber(totalLikesAll)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                <BookOpen className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Tutor</p>
                  <p className="text-2xl font-black text-slate-700 leading-none">{tutors.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, jurusan, atau kampus..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto shrink-0">
              {FILTER_TAGS.map((tag) => (
                <button key={tag} onClick={() => setActiveTag(tag)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeTag === tag ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tag === "Mahasiswa Super" ? "🏆 " : tag === "Mahasiswa Aktif" ? "⚡ " : ""}{tag}
                </button>
              ))}
              <div className="relative shrink-0">
                <button onClick={() => setJurusanOpen(!jurusanOpen)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                    activeJurusan !== "Semua" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-100" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  {activeJurusan === "Semua" ? "Jurusan" : activeJurusan.length > 14 ? activeJurusan.slice(0, 14) + "…" : activeJurusan}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${jurusanOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {jurusanOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 overflow-hidden"
                    >
                      <div className="max-h-72 overflow-y-auto py-2">
                        {["Semua", ...JURUSAN_LIST].map((j) => (
                          <button key={j} onClick={() => { setActiveJurusan(j); setJurusanOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${activeJurusan === j ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}
                          >
                            {j}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-1.5 bg-slate-200" />
                <div className="p-5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="w-16 h-8 bg-slate-200 rounded-xl shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="text-5xl mb-6">🔍</div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Tidak ada tutor ditemukan</h2>
            <p className="text-sm font-medium text-slate-500 max-w-sm mb-6">Coba ubah filter atau kata kunci pencarianmu</p>
            <button onClick={() => { setSearch(""); setActiveTag("Semua"); setActiveJurusan("Semua"); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer">
              Reset Filter
            </button>
          </motion.div>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-500 mb-6">
              Menampilkan <span className="text-slate-900">{filtered.length}</span> tutor
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((tutor, i) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  currentUserId={currentUser?.uid ?? null}
                  onChat={handleChat}
                  onOpenModal={setSelectedTutor}
                  index={i}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedTutor && (
          <TutorModal
            tutor={selectedTutor}
            currentUserId={currentUser?.uid ?? null}
            onChat={handleChat}
            onClose={() => setSelectedTutor(null)}
          />
        )}
      </AnimatePresence>

      {jurusanOpen && <div className="fixed inset-0 z-10" onClick={() => setJurusanOpen(false)} />}
    </div>
  );
}