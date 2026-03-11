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
  TrendingUp,
  LogOut,
  Mail,
  Chrome
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const COLORS = ['#4f46e5', '#c026d3', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [userStats, setUserStats] = useState({ total: 0, mahasiswa: 0, admin: 0, google: 0, password: 0 });
  const [videoStats, setVideoStats] = useState({ total: 0, free: 0, paid: 0 });
  const [postStats, setPostStats] = useState({ total: 0, free: 0, paid: 0 });
  const [txStats, setTxStats] = useState({ total: 0 });
  const [reqStats, setReqStats] = useState({ total: 0, open: 0, taken: 0, done: 0, failed: 0 });

  const [userChartData, setUserChartData] = useState<any[]>([]);
  const [contentChartData, setContentChartData] = useState<any[]>([]);
  const [txChartData, setTxChartData] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          await fetchAllData();
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const processChartData = (docs: any[]) => {
    const counts: Record<string, number> = {};
    docs.forEach(d => {
      if (d.createdAt && d.createdAt.toDate) {
        const date = d.createdAt.toDate();
        const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        counts[monthYear] = (counts[monthYear] || 0) + 1;
      }
    });
    return Object.keys(counts).map(key => ({ name: key, total: counts[key] }));
  };

  const fetchAllData = async () => {
    try {
      const [usersSnap, videosSnap, postsSnap, txSnap, reqSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "videos")),
        getDocs(collection(db, "posts")),
        getDocs(collection(db, "purchases")),
        getDocs(collection(db, "requests"))
      ]);

      const users = usersSnap.docs.map(d => d.data());
      const uStats = { total: users.length, mahasiswa: 0, admin: 0, google: 0, password: 0 };
      users.forEach(u => {
        if (u.role === "admin") uStats.admin++; else uStats.mahasiswa++;
        if (u.provider === "google") uStats.google++; else uStats.password++;
      });
      setUserStats(uStats);
      setUserChartData(processChartData(users));

      const videos = videosSnap.docs.map(d => d.data());
      const vStats = { total: videos.length, free: 0, paid: 0 };
      videos.forEach(v => { if (v.price > 0) vStats.paid++; else vStats.free++; });
      setVideoStats(vStats);

      const posts = postsSnap.docs.map(d => d.data());
      const pStats = { total: posts.length, free: 0, paid: 0 };
      posts.forEach(p => { if (p.price > 0) pStats.paid++; else pStats.free++; });
      setPostStats(pStats);

      const combinedContent = [...videos, ...posts];
      setContentChartData(processChartData(combinedContent));

      const txs = txSnap.docs.map(d => d.data());
      setTxStats({ total: txs.length });
      setTxChartData(processChartData(txs));

      const reqs = reqSnap.docs.map(d => d.data());
      const rStats = { total: reqs.length, open: 0, taken: 0, done: 0, failed: 0 };
      reqs.forEach(r => {
        if (r.status === "open") rStats.open++;
        else if (r.status === "taken") rStats.taken++;
        else if (r.status === "done") rStats.done++;
        else rStats.failed++;
      });
      setReqStats(rStats);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const requestPieData = [
    { name: 'Open', value: reqStats.open },
    { name: 'Taken', value: reqStats.taken },
    { name: 'Done', value: reqStats.done },
    { name: 'Failed', value: reqStats.failed }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/60 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-fuchsia-100/60 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <motion.aside 
        initial={{ x: -300 }} animate={{ x: 0 }}
        className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col z-20 relative"
      >
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold text-indigo-600">
            <ShieldCheck className="w-8 h-8" /> TukarIlmu.
          </Link>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Admin Workspace</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 bg-indigo-50 text-indigo-700 font-bold rounded-2xl transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/user" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Users className="w-5 h-5" /> Manage Users
          </Link>
          <Link href="/admin/video" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Film className="w-5 h-5" /> Manage Videos
          </Link>
          <Link href="/admin/post" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
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
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Platform Overview</h1>
          <p className="text-slate-500">Statistik real-time dari aktivitas seluruh pengguna TukarIlmu.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4"><Users className="w-6 h-6" /></div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{userStats.total}</h3>
            <p className="text-sm font-semibold text-slate-500">Total Pengguna</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-400">
              <span>{userStats.mahasiswa} Mahasiswa</span>
              <span>{userStats.admin} Admin</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-fuchsia-50 rounded-2xl flex items-center justify-center text-fuchsia-600 mb-4"><Film className="w-6 h-6" /></div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{videoStats.total}</h3>
            <p className="text-sm font-semibold text-slate-500">Total Video Materi</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-400">
              <span className="text-green-500">{videoStats.free} Gratis</span>
              <span className="text-fuchsia-500">{videoStats.paid} Premium</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mb-4"><FileText className="w-6 h-6" /></div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{postStats.total}</h3>
            <p className="text-sm font-semibold text-slate-500">Total Artikel/Blog</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-400">
              <span className="text-green-500">{postStats.free} Gratis</span>
              <span className="text-violet-500">{postStats.paid} Premium</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4"><CreditCard className="w-6 h-6" /></div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{txStats.total}</h3>
            <p className="text-sm font-semibold text-slate-500">Total Transaksi</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" /> Transaksi Berhasil
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-900">Pertumbuhan Pengguna</h3>
              <div className="flex gap-4 text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-1"><Chrome className="w-4 h-4 text-blue-500" /> {userStats.google}</span>
                <span className="flex items-center gap-1"><Mail className="w-4 h-4 text-slate-400" /> {userStats.password}</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userChartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Aktivitas Transaksi</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={txChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="col-span-1 lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Upload Materi Baru</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contentChartData}>
                  <defs>
                    <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c026d3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c026d3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="total" stroke="#c026d3" strokeWidth={3} fillOpacity={1} fill="url(#colorContent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Status Request</h3>
            <p className="text-sm font-semibold text-slate-500 mb-8">Total {reqStats.total} Request</p>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={requestPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {requestPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 600, color: '#64748b'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}