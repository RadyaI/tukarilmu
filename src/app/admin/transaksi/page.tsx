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
  Search,
  Calendar,
  PlayCircle,
  TrendingUp,
  Wallet,
  Landmark
} from "lucide-react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getAllPurchasesForAdmin } from "../../../utils/purchases";

export default function AdminManageTransaksi() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
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
          fetchPurchases();
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPurchases = async () => {
    setLoading(true);
    const data = await getAllPurchasesForAdmin();
    setPurchases(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-";
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredPurchases = purchases.filter(p =>
    p.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.buyerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.materialTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGrossRevenue = filteredPurchases.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalPlatformFee = filteredPurchases.reduce((acc, curr) => acc + (curr.platformFee || 0), 0);
  const totalNetAmount = filteredPurchases.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-teal-100/50 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col z-20 relative shrink-0">
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold text-emerald-600">
            <ShieldCheck className="w-8 h-8" />
          </Link>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Admin Workspace</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/user" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Users className="w-5 h-5" /> Manage Users
          </Link>
          <Link href="/admin/video" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Film className="w-5 h-5" /> Manage Videos
          </Link>
          <Link href="/admin/post" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <FileText className="w-5 h-5" /> Manage Posts
          </Link>
          <Link href="/admin/transaksi" className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 text-emerald-700 font-bold rounded-2xl transition-colors cursor-pointer">
            <CreditCard className="w-5 h-5" /> Transaksi
          </Link>
          <Link href="/admin/request" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-semibold rounded-2xl transition-colors cursor-pointer">
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
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Riwayat Transaksi</h1>
            <p className="text-slate-500">Pantau seluruh aliran pembelian dan keuntungan platform.</p>
          </div>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari ID, pembeli, atau materi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-slate-800"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">Total Uang Masuk</p>
              <h3 className="text-xl font-extrabold text-slate-900">{formatPrice(totalGrossRevenue)}</h3>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">Pendapatan Kreator</p>
              <h3 className="text-xl font-extrabold text-slate-900">{formatPrice(totalNetAmount)}</h3>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Landmark className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 mb-0.5">Keuntungan Platform</p>
              <h3 className="text-xl font-extrabold text-slate-900">{formatPrice(totalPlatformFee)}</h3>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">Total Pembelian</p>
              <h3 className="text-xl font-extrabold text-slate-900">{filteredPurchases.length} <span className="text-sm font-medium text-slate-400">item</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 whitespace-nowrap">
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">ID & Waktu</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Pembeli</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Materi</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Detail Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length > 0 ? filteredPurchases.map((p, i) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors whitespace-nowrap"
                  >
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs font-bold text-slate-400 mb-1">#{p.id.substring(0, 8).toUpperCase()}</p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                        <Calendar className="w-4 h-4 text-emerald-500" /> {formatDate(p.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{p.buyerName}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{p.buyerEmail}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.type === 'video' ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
                          {p.type === 'video' ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.materialTitle}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${p.type === 'video' ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
                            {p.type === 'video' ? 'Video' : 'Artikel'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex justify-between w-40 text-xs font-medium text-slate-500">
                          <span>Kreator:</span>
                          <span className="font-bold text-slate-700">{formatPrice(p.netAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between w-40 text-xs font-medium text-slate-500 mb-1">
                          <span>Harga Jual:</span>
                          <span className="font-bold text-slate-700">{formatPrice(p.price || 0)}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-lg text-xs inline-flex items-center justify-between w-40">
                          <span>Fee:</span>
                          <span>+{formatPrice(p.platformFee || 0)}</span>
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Tidak ada transaksi yang ditemukan.
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