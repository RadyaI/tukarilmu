"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video as VideoIcon,
  FileText,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  Heart,
  Tag,
  PlayCircle,
  Wallet
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserVideos, deleteVideo } from "../../utils/videos";
import { getUserPosts, deletePost } from "../../utils/posts";
import { getCreatorRevenue } from "../../utils/purchases";
import { Video } from "../../types/video";
import { Post } from "../../types/post";

type TabType = "video" | "post";

export default function MyPostsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("video");

  const [videos, setVideos] = useState<(Video & { id: string })[]>([]);
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      await loadData(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  const loadData = async (uid: string) => {
    setLoading(true);
    const [userVids, userPosts, userRevenue] = await Promise.all([
      getUserVideos(uid),
      getUserPosts(uid),
      getCreatorRevenue(uid)
    ]);
    setVideos(userVids);
    setPosts(userPosts);
    setRevenue(userRevenue);
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Rp.0" : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const handleDelete = async (id: string, type: TabType) => {
    const result = await Swal.fire({
      title: 'Yakin mau hapus?',
      text: "Materi yang dihapus nggak bisa dikembalikan lagi loh.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-full px-6 py-2 font-bold',
        cancelButton: 'rounded-full px-6 py-2 font-bold'
      }
    });

    if (result.isConfirmed) {
      toast.loading("Menghapus materi...", { id: "delete-toast" });
      try {
        if (type === "video") {
          await deleteVideo(id);
          setVideos(videos.filter(v => v.id !== id));
        } else {
          await deletePost(id);
          setPosts(posts.filter(p => p.id !== id));
        }
        toast.success("Materi berhasil dihapus!", { id: "delete-toast" });
      } catch (error) {
        toast.error("Gagal menghapus materi.", { id: "delete-toast" });
      }
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentData = activeTab === "video" ? videos : posts;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />

      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-fuchsia-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Karya Kamu</h1>
            <p className="text-lg text-slate-600">Kelola semua materi video dan artikel yang sudah kamu bagikan.</p>
          </div>
          <Link href="/upload" className="inline-flex px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
            <PlusCircle className="w-5 h-5" /> Upload New
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 w-fit rounded-[2rem] shadow-sm border border-white mb-8 inline-flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Pendapatan Bersih</p>
            <h2 className="text-3xl font-extrabold text-slate-900">{formatPrice(revenue)}</h2>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8">
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 max-w-md mx-auto md:mx-0">
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "video" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <VideoIcon className="w-4 h-4" /> Video ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab("post")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "post" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <FileText className="w-4 h-4" /> Post ({posts.length})
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {currentData.length > 0 ? currentData.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={item.id}
                    className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
                  >
                    <div className={`w-full h-44 flex items-center justify-center relative ${activeTab === 'video' ? 'bg-indigo-50/50' : 'bg-fuchsia-50/50'}`}>
                      {item.thumbnailUrl ? (
                        <>
                          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 z-0" />
                          <div className="absolute inset-0 bg-slate-900/20 z-0"></div>
                          {activeTab === 'video' ? (
                            <PlayCircle className="w-10 h-10 text-white z-10 drop-shadow-md" />
                          ) : (
                            <FileText className="w-10 h-10 text-white z-10 drop-shadow-md" />
                          )}
                        </>
                      ) : (
                        activeTab === 'video' ? (
                          <VideoIcon className="w-10 h-10 text-indigo-300" />
                        ) : (
                          <FileText className="w-10 h-10 text-fuchsia-300" />
                        )
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> {item.likes}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {item.course}
                        </span>
                        <span className="text-sm font-extrabold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">
                          {formatPrice(item.price)}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{item.title}</h3>

                      <div className="mt-auto pt-5 grid grid-cols-3 gap-2">
                        <Link
                          href={activeTab === "video" ? `/video/${item.id}` : `/post/${item.id}`}
                          className="flex flex-col items-center justify-center py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer group"
                        >
                          <Eye className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">View</span>
                        </Link>
                        <Link
                          href={`/edit/${activeTab}/${item.id}`}
                          className="flex flex-col items-center justify-center py-2.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors cursor-pointer group"
                        >
                          <Edit3 className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, activeTab)}
                          className="flex flex-col items-center justify-center py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-colors cursor-pointer group"
                        >
                          <Trash2 className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-3xl"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'video' ? <VideoIcon className="w-8 h-8 text-slate-400" /> : <FileText className="w-8 h-8 text-slate-400" />}
                    </div>
                    <p className="text-slate-500 font-medium mb-4">Kamu belum upload {activeTab === 'video' ? 'video' : 'artikel'} apapun.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}