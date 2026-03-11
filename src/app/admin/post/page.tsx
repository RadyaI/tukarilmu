"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Film, 
  FileText, 
  CreditCard, 
  HelpCircle, 
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Trash2,
  Eye,
  Search,
  Tag,
  GraduationCap,
  Heart
} from "lucide-react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { getAllPostsForAdmin, deletePostAdmin } from "../../../utils/posts";
import { Post } from "../../../types/post";

export default function AdminManagePosts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          fetchPosts();
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPosts = async () => {
    setLoading(true);
    const data = await getAllPostsForAdmin();
    setPosts(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleDelete = async (postId: string) => {
    const result = await Swal.fire({
      title: 'Hapus Artikel Ini?',
      text: "Data konten teks/blog ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (result.isConfirmed) {
      toast.loading("Menghapus artikel...", { id: "delete" });
      try {
        await deletePostAdmin(postId);
        setPosts(posts.filter(p => p.id !== postId));
        toast.success("Artikel berhasil dihapus!", { id: "delete" });
      } catch (error: any) {
        toast.error(error.message, { id: "delete" });
      }
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Gratis" : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const filteredPosts = posts.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.jurusan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <Toaster position="top-center" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-violet-100/60 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-fuchsia-100/60 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col z-20 relative shrink-0">
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold text-indigo-600">
            <ShieldCheck className="w-8 h-8" />
          </Link>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Admin Workspace</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/user" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Users className="w-5 h-5" /> Manage Users
          </Link>
          <Link href="/admin/video" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Film className="w-5 h-5" /> Manage Videos
          </Link>
          <Link href="/admin/post" className="flex items-center gap-3 px-4 py-3.5 bg-violet-50 text-violet-700 font-bold rounded-2xl transition-colors cursor-pointer">
            <FileText className="w-5 h-5" /> Manage Posts
          </Link>
          <Link href="/admin/transaksi" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <CreditCard className="w-5 h-5" /> Transaksi
          </Link>
          <Link href="/admin/request" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <HelpCircle className="w-5 h-5" /> Requests
          </Link>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 font-bold rounded-2xl transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 z-10 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Manajemen Artikel/Blog</h1>
            <p className="text-slate-500">Kelola dan pantau semua publikasi tulisan dari kreator di platform.</p>
          </div>
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Cari judul, matkul, atau jurusan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium text-slate-800"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Info Materi Teks</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Statistik</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.length > 0 ? filteredPosts.map((p, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={p.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5 max-w-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {p.thumbnailUrl ? (
                            <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-violet-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate mb-1">{p.title}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {p.course}
                            </span>
                            <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> {p.jurusan}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${p.price === 0 ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-700'}`}>
                        {formatPrice(p.price)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-red-500 font-semibold text-sm">
                        <Heart className="w-4 h-4 fill-red-500" /> {p.likes}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link 
                          href={`/post/${p.id}`}
                          title="Lihat Artikel"
                          className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          title="Hapus Artikel"
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Tidak ada artikel yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}