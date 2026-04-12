"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Instagram,
  Linkedin,
  Globe,
  GraduationCap,
  Building2,
  BookOpen,
  MapPin,
  MessageCircle,
  PlayCircle,
  FileText,
  Heart,
  Tag,
  Shield,
  Sparkles,
  Star,
  Users,
  Calendar
} from "lucide-react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";

const tagStyles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  "Mahasiswa": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Users },
  "Admin": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: Shield },
  "Mahasiswa Super": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Star },
  "Mahasiswa Aktif": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: Sparkles },
};

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm">
      <span className={`text-2xl font-extrabold ${color} mb-0.5`}>{value}</span>
      <span className="text-xs font-semibold text-slate-500 text-center">{label}</span>
    </div>
  );
}

export default function UserPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"video" | "post">("video");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!profileId) return;
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", profileId));
      if (!userDoc.exists()) {
        router.push("/not-found");
        return;
      }
      setProfileUser({ id: userDoc.id, ...userDoc.data() });

      const [videosSnap, postsSnap] = await Promise.all([
        getDocs(query(collection(db, "videos"), where("userId", "==", profileId))),
        getDocs(query(collection(db, "posts"), where("userId", "==", profileId))),
      ]);

      const vids = videosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const psts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // sort by createdAt desc
      const sortByDate = (a: any, b: any) => {
        const da = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const db2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return db2 - da;
      };

      setVideos(vids.sort(sortByDate));
      setPosts(psts.sort(sortByDate));
    } catch (err) {
      router.push("/not-found");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
  };

  const getChatId = () => {
    if (!currentUser) return null;
    const ids = [currentUser.uid, profileId].sort();
    return ids.join("-");
  };

  const totalLikes = [
    ...videos.map((v: any) => v.likes || 0),
    ...posts.map((p: any) => p.likes || 0),
  ].reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileUser) return null;

  const tag = profileUser.tag || "Mahasiswa";
  const tagStyle = tagStyles[tag] ?? tagStyles["Mahasiswa"];
  const TagIcon = tagStyle.icon;
  const isOwnProfile = currentUser?.uid === profileId;
  const chatId = getChatId();
  const displayData = activeTab === "video" ? videos : posts;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      {/* bg blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45rem] h-[45rem] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40rem] h-[40rem] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] left-[35%] w-[30rem] h-[30rem] bg-fuchsia-50/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Back */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-8 flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div className="relative mb-5">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-indigo-100">
                  {profileUser.avatar ? (
                    <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-4xl font-extrabold">
                      {profileUser.name?.[0]?.toUpperCase() || profileUser.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {/* Online dot / role badge */}
                {profileUser.role === "admin" && (
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <h1 className="text-xl font-extrabold text-slate-900 mb-1">
                {profileUser.name || "Pengguna TukarIlmu"}
              </h1>
              <p className="text-sm text-slate-500 mb-3">{profileUser.email}</p>

              {/* Tag Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border mb-4 ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}
              >
                <TagIcon className="w-3.5 h-3.5" />
                {tag}
              </span>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-sm text-slate-600 leading-relaxed mb-4 px-2 italic">
                  "{profileUser.bio}"
                </p>
              )}

              {/* Chat / Own Profile Button */}
              {!isOwnProfile && (
                currentUser ? (
                  <Link
                    href={`/chat/${chatId}`}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-indigo-200 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Kirim Pesan
                    {/* <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Coming Soon</span> */}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-indigo-50 text-indigo-600 font-bold rounded-2xl transition-all border border-slate-200 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Login untuk Chat
                  </Link>
                )
              )}
              {isOwnProfile && (
                <Link
                  href="/dashboard/profile"
                  className="w-full text-center px-5 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 font-bold rounded-2xl transition-all border border-slate-200 text-sm cursor-pointer"
                >
                  Edit Profil Kamu
                </Link>
              )}
            </motion.div>

            {/* Info Pendidikan */}
            {(profileUser.kampus || profileUser.jurusan || profileUser.angkatan || profileUser.semester) && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6"
              >
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-violet-500" /> Info Pendidikan
                </h3>
                <div className="space-y-3">
                  {profileUser.kampus && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold">{profileUser.kampus}</span>
                    </div>
                  )}
                  {profileUser.jurusan && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{profileUser.jurusan}</span>
                    </div>
                  )}
                  {profileUser.angkatan && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Angkatan {profileUser.angkatan}</span>
                    </div>
                  )}
                  {profileUser.semester && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Semester {profileUser.semester}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Social Links */}
            {(profileUser.igUrl || profileUser.linkedinUrl || profileUser.portfolioUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6"
              >
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Sosial Media</h3>
                <div className="flex flex-col gap-3">
                  {profileUser.igUrl && (
                    <a
                      href={profileUser.igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-pink-500 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                        <Instagram className="w-4 h-4 text-pink-500" />
                      </div>
                      Instagram
                    </a>
                  )}
                  {profileUser.linkedinUrl && (
                    <a
                      href={profileUser.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Linkedin className="w-4 h-4 text-blue-600" />
                      </div>
                      LinkedIn
                    </a>
                  )}
                  {profileUser.portfolioUrl && (
                    <a
                      href={profileUser.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Globe className="w-4 h-4 text-emerald-600" />
                      </div>
                      Portfolio
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="grid grid-cols-3 gap-4"
            >
              <StatCard value={videos.length} label="Video Diupload" color="text-indigo-600" />
              <StatCard value={posts.length} label="Artikel Ditulis" color="text-fuchsia-600" />
              <StatCard value={totalLikes} label="Total Likes" color="text-red-500" />
            </motion.div>

            {/* Materi Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-extrabold text-slate-900">Materi dari {profileUser.name?.split(" ")[0] || "Kreator"}</h2>
              </div>

              {/* Tab switcher */}
              <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 max-w-xs">
                <button
                  onClick={() => setActiveTab("video")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "video" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  <PlayCircle className="w-4 h-4" /> Video ({videos.length})
                </button>
                <button
                  onClick={() => setActiveTab("post")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "post" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  <FileText className="w-4 h-4" /> Artikel ({posts.length})
                </button>
              </div>

              {/* Material List */}
              {displayData.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    {activeTab === "video" ? <PlayCircle className="w-7 h-7 text-slate-300" /> : <FileText className="w-7 h-7 text-slate-300" />}
                  </div>
                  <p className="text-slate-400 font-semibold text-sm">
                    Belum ada {activeTab === "video" ? "video" : "artikel"} yang dipublikasikan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayData.map((item: any, i: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link
                        href={`/${activeTab}/${item.id}`}
                        className="flex flex-col bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden group"
                      >
                        {/* Thumbnail */}
                        <div className={`w-full h-36 flex items-center justify-center relative overflow-hidden ${activeTab === "video" ? "bg-indigo-50" : "bg-fuchsia-50"}`}>
                          {item.thumbnailUrl ? (
                            <>
                              <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/35 transition-colors" />
                              {activeTab === "video"
                                ? <PlayCircle className="w-9 h-9 text-white/90 z-10 drop-shadow" />
                                : <FileText className="w-9 h-9 text-white/90 z-10 drop-shadow" />
                              }
                            </>
                          ) : (
                            activeTab === "video"
                              ? <PlayCircle className="w-9 h-9 text-indigo-300" />
                              : <FileText className="w-9 h-9 text-fuchsia-300" />
                          )}
                          {/* Likes badge */}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 flex items-center gap-1 z-10 shadow-sm">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {item.likes || 0}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {item.course}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${!item.price || item.price === 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug">{item.title}</h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}