"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  PlayCircle, 
  FileText, 
  Calendar, 
  User, 
  Tag,
  ArrowRight,
  Compass
} from "lucide-react";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserPurchases } from "../../utils/purchases";

export default function MyPurchasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      await loadPurchases(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  const loadPurchases = async (uid: string) => {
    setLoading(true);
    const userPurchases = await getUserPurchases(uid);
    setPurchases(userPurchases);
    setLoading(false);
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-";
    if (dateObj.toDate) return dateObj.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return new Date(dateObj).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Materi Dibeli 🛍️</h1>
            <p className="text-lg text-slate-600">Kumpulan semua materi video dan artikel yang sudah kamu beli.</p>
          </div>
          <Link href="/explore" className="inline-flex px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
            <Compass className="w-5 h-5" /> Explore Materi Baru
          </Link>
        </div>

        {loading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {purchases.length > 0 ? purchases.map((item, index) => {
                const isVideo = item.type === "video";
                const isAvailable = !!item.material;

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    key={item.id} 
                    className="bg-white/90 backdrop-blur-sm rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-5 flex flex-col sm:flex-row gap-5 group"
                  >
                    <div className={`w-full sm:w-40 h-40 shrink-0 rounded-[1.2rem] flex items-center justify-center relative overflow-hidden ${isVideo ? 'bg-indigo-50/50' : 'bg-fuchsia-50/50'}`}>
                      {isAvailable && item.material.thumbnailUrl ? (
                        <>
                          <img src={item.material.thumbnailUrl} alt={item.material.title} className="w-full h-full object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/40 transition-colors z-0"></div>
                          {isVideo ? (
                            <PlayCircle className="w-10 h-10 text-white/90 group-hover:text-white transition-colors z-10 drop-shadow-md" />
                          ) : (
                            <FileText className="w-10 h-10 text-white/90 group-hover:text-white transition-colors z-10 drop-shadow-md" />
                          )}
                        </>
                      ) : (
                        isVideo ? (
                          <PlayCircle className="w-12 h-12 text-indigo-300 group-hover:text-indigo-500 transition-colors z-10" />
                        ) : (
                          <FileText className="w-12 h-12 text-fuchsia-300 group-hover:text-fuchsia-500 transition-colors z-10" />
                        )
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        {isAvailable ? (
                          <>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="font-bold text-lg text-slate-900 line-clamp-2">{item.material.title}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mb-3">
                              <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${isVideo ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
                                <Tag className="w-3 h-3" /> {item.material.course}
                              </span>
                              <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg text-slate-600">
                                <User className="w-3 h-3" /> {item.creatorName}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="mb-4">
                            <h3 className="font-bold text-lg text-slate-400 italic">Materi tidak lagi tersedia</h3>
                            <p className="text-sm text-slate-500">Kreator mungkin telah menghapus materi ini.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Calendar className="w-4 h-4" /> 
                          Dibeli pada {formatDate(item.createdAt)}
                        </div>
                        {isAvailable && (
                          <Link 
                            href={isVideo ? `/video/${item.material.id}` : `/post/${item.material.id}`}
                            className={`w-full sm:w-auto px-5 py-2.5 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${isVideo ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white'}`}
                          >
                            {isVideo ? (
                              <><PlayCircle className="w-4 h-4" /> Watch Video</>
                            ) : (
                              <><FileText className="w-4 h-4" /> Read Post</>
                            )}
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="col-span-full bg-white/80 backdrop-blur-xl rounded-[2rem] border-2 border-dashed border-slate-200 p-16 text-center shadow-sm"
                >
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Keranjang Belajarmu Masih Kosong</h3>
                  <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">Kamu belum pernah membeli materi apapun. Yuk cari materi yang bisa bantu ningkatin pemahaman kuliahmu!</p>
                  <Link href="/explore" className="inline-flex px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 cursor-pointer items-center gap-2">
                    Mulai Eksplorasi <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}