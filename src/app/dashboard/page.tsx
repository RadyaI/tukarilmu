"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  UploadCloud, 
  ShoppingBag, 
  FileQuestion, 
  PlayCircle, 
  FileText, 
  PlusCircle, 
  ArrowRight, 
  Tag, 
  Clock,
  TrendingUp,
  History
} from "lucide-react";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    uploads: 0,
    purchases: 0,
    requests: 0
  });

  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      await fetchDashboardData(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async (uid: string) => {
    try {
      const [videosSnap, postsSnap, requestsSnap, purchasesSnap] = await Promise.all([
        getDocs(query(collection(db, "videos"), where("userId", "==", uid))),
        getDocs(query(collection(db, "posts"), where("userId", "==", uid))),
        getDocs(query(collection(db, "requests"), where("userId", "==", uid))),
        getDocs(query(collection(db, "purchases"), where("userId", "==", uid)))
      ]);

      const videos = videosSnap.docs.map(doc => ({ id: doc.id, type: "video", ...doc.data() }));
      const posts = postsSnap.docs.map(doc => ({ id: doc.id, type: "post", ...doc.data() }));
      const requests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const purchases = purchasesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const allUploads = [...videos, ...posts].sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      const sortedRequests = requests.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      const sortedPurchases = purchases.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      setStats({
        uploads: allUploads.length,
        purchases: purchases.length,
        requests: requests.length
      });

      setRecentUploads(allUploads.slice(0, 3));
      setRecentRequests(sortedRequests.slice(0, 3));
      setRecentPurchases(sortedPurchases.slice(0, 3));
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Gratis" : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || "Mahasiswa";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Halo, {displayName}! 👋</h1>
            <p className="text-lg text-slate-600">Selamat datang di dashboard kamu. Yuk cek aktivitas belajarmu hari ini.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link href="/upload" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 flex items-center gap-2 cursor-pointer">
              <UploadCloud className="w-5 h-5" /> Upload Materi
            </Link>
            <Link href="/request/create" className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 flex items-center gap-2 cursor-pointer">
              <PlusCircle className="w-5 h-5" /> Buat Request
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm flex items-center gap-6 group"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Diupload</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.uploads} <span className="text-sm font-medium text-slate-400">materi</span></h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm flex items-center gap-6 group"
          >
            <div className="w-16 h-16 bg-fuchsia-50 rounded-2xl flex items-center justify-center text-fuchsia-600 group-hover:scale-110 group-hover:bg-fuchsia-600 group-hover:text-white transition-all">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Materi Dibeli</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.purchases} <span className="text-sm font-medium text-slate-400">materi</span></h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm flex items-center gap-6 group"
          >
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Request Dibuat</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.requests} <span className="text-sm font-medium text-slate-400">request</span></h3>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <section className="bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Materi Terbarumu</h2>
              </div>
              <Link href="/my-posts" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentUploads.length > 0 ? recentUploads.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow group">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'video' ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
                    {item.type === 'video' ? <PlayCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <Tag className="w-3 h-3" /> {item.course}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-extrabold text-slate-800">{formatPrice(item.price)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500 font-medium mb-4">Kamu belum pernah upload materi.</p>
                  <Link href="/upload" className="inline-flex px-5 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer">
                    Mulai Upload
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fuchsia-100 rounded-xl flex items-center justify-center text-fuchsia-600">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pembelian Terakhir</h2>
              </div>
              <Link href="/my-purchases" className="text-sm font-bold text-fuchsia-600 hover:text-fuchsia-800 flex items-center gap-1 cursor-pointer transition-colors">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentPurchases.length > 0 ? recentPurchases.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 group-hover:text-fuchsia-600 transition-colors">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Berhasil dibeli</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500 font-medium mb-4">Belum ada materi yang dibeli.</p>
                  <Link href="/explore" className="inline-flex px-5 py-2.5 bg-fuchsia-50 text-fuchsia-600 font-bold rounded-xl hover:bg-fuchsia-100 transition-colors cursor-pointer">
                    Explore Materi
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                <FileQuestion className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Request Dibuat</h2>
            </div>
            <Link href="/my-requests" className="text-sm font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer transition-colors">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRequests.length > 0 ? recentRequests.map((req) => (
              <div key={req.id} className="p-5 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 mb-3">
                  <Tag className="w-3 h-3" /> {req.course}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 truncate">{req.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{req.description}</p>
                <div className="flex items-center text-xs text-slate-400 gap-1 mt-auto">
                  <Clock className="w-3 h-3" /> Sedang menunggu jawaban
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500 font-medium mb-4">Kamu belum membuat request apapun.</p>
                <Link href="/request/create" className="inline-flex px-5 py-2.5 bg-violet-50 text-violet-600 font-bold rounded-xl hover:bg-violet-100 transition-colors cursor-pointer">
                  Buat Request
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}