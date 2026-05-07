"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { checkIsAdmin } from "@/utils/auth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
} from "recharts";
import {
  Users, TrendingUp, MessageSquare, Star, ChevronDown,
  ChevronUp, Download, RefreshCw, ShieldAlert, Loader2,
  Sparkles, BookOpen, Zap, DollarSign, Lightbulb,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Response {
  id: string;
  email: string;
  nama: string;
  jurusan_semester: string;
  frekuensi_butuh_pencerahan: string;
  kesan_tampilan_skala: number;
  tiga_kata: string;
  bagian_bingung: string;
  bagian_bingung_custom?: string;
  request_materi_mudah: string;
  request_materi_custom?: string;
  fitur_chat_berguna: string;
  fitur_chat_custom?: string;
  alur_kreator: string;
  willingness_to_pay: string;
  mau_jadi_kreator: string;
  kritik_saran: string;
  submitted_at?: any;
}

// ─── Color palette ───────────────────────────────────────────────────────────
const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function countField(data: Response[], field: keyof Response): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  data.forEach((r) => {
    const raw = r[field] as string;
    if (!raw) return;
    const key = raw === "Ketik sendiri" ? "(Ketik sendiri)" : raw;
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function avgField(data: Response[], field: keyof Response): number {
  const vals = data.map((r) => Number(r[field])).filter((v) => !isNaN(v) && v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-xl"
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{label}</p>
          <p className="text-4xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1.5 font-medium">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "25", border: `1px solid ${color}40` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeader({ emoji, title, count }: { emoji: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-2xl">{emoji}</span>
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      {count !== undefined && (
        <span className="ml-auto text-xs bg-white/8 border border-white/10 text-white/50 font-semibold px-2.5 py-1 rounded-full">
          {count} responden
        </span>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13132a] border border-white/12 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="text-white font-bold">{payload[0].value} responden</p>
    </div>
  );
};

function HorizBar({ data, color = "#6366f1" }: { data: { name: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3 mt-2">
      {data.map((d, i) => (
        <div key={d.name}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/70 font-medium truncate max-w-[75%]">{d.name}</span>
            <span className="text-white font-bold">{d.value}</span>
          </div>
          <div className="h-2 bg-white/6 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WordCloud({ texts }: { texts: string[] }) {
  const wordMap: Record<string, number> = {};
  texts.forEach((t) => {
    t.split(/[,、\s]+/).forEach((w) => {
      const clean = w.trim().toLowerCase();
      if (clean.length > 1) wordMap[clean] = (wordMap[clean] || 0) + 1;
    });
  });
  const words = Object.entries(wordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  const max = words[0]?.[1] || 1;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {words.map(([word, count]) => {
        const size = 0.7 + (count / max) * 0.8;
        const opacity = 0.4 + (count / max) * 0.6;
        const colorIdx = Math.floor(Math.random() * COLORS.length);
        return (
          <span
            key={word}
            className="px-2.5 py-1 rounded-full font-bold border transition-all"
            style={{
              fontSize: `${size}rem`,
              opacity,
              background: COLORS[colorIdx] + "18",
              borderColor: COLORS[colorIdx] + "40",
              color: COLORS[colorIdx],
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

function EsaiCard({ items }: { items: { nama: string; email: string; text: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, 4);
  return (
    <div>
      <div className="space-y-3 mt-2">
        {shown.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-white/4 border border-white/8 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center">
                {item.nama?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-xs font-semibold text-white/50">{item.nama || "Anonim"}</span>
              <span className="text-xs text-white/25">· {item.email}</span>
            </div>
            <p className="text-white/75 text-sm leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
      {items.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Sembunyiin</> : <><ChevronDown className="w-3.5 h-3.5" /> Lihat semua ({items.length})</>}
        </button>
      )}
    </div>
  );
}

function ChartCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function KuesionerResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [data, setData] = useState<Response[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    const snap = await getDocs(query(collection(db, "kuesioner_tukarilmu"), orderBy("submitted_at", "desc")));
    setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Response)));
    setRefreshing(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      const admin = await checkIsAdmin(u.uid);
      if (!admin) { setUnauthorized(true); setLoading(false); return; }
      await fetchData();
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#080814] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-sm font-medium">Ngambil data...</p>
      </div>
    </div>
  );

  // ── Unauthorized ───────────────────────────────────────────────────────
  if (unauthorized) return (
    <div className="min-h-screen bg-[#080814] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold text-white mb-2">Akses Ditolak</h2>
        <p className="text-white/45 mb-6">Halaman ini khusus buat admin aja ya broo 🔒</p>
        <button onClick={() => router.push("/")} className="bg-white/8 border border-white/12 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/12 transition-all cursor-pointer">
          Balik Deh
        </button>
      </motion.div>
    </div>
  );

  // ── Derived data ───────────────────────────────────────────────────────
  const n = data.length;
  const avgStar = avgField(data, "kesan_tampilan_skala");

  const frekData = countField(data, "frekuensi_butuh_pencerahan");
  const bingungData = countField(data, "bagian_bingung");
  const requestData = countField(data, "request_materi_mudah");
  const chatData = countField(data, "fitur_chat_berguna");
  const wtpData = countField(data, "willingness_to_pay");
  const kreatorData = countField(data, "mau_jadi_kreator");

  const tigaKataTexts = data.map((r) => r.tiga_kata).filter(Boolean);
  const esaiKreator = data.map((r) => ({ nama: r.nama, email: r.email, text: r.alur_kreator })).filter((r) => r.text);
  const esaiKritik = data.map((r) => ({ nama: r.nama, email: r.email, text: r.kritik_saran })).filter((r) => r.text);

  const mauKreatorCount = data.filter((r) => r.mau_jadi_kreator === "Gas, mau banget!").length;
  const kreatorPct = n ? Math.round((mauKreatorCount / n) * 100) : 0;

  const bayarCount = data.filter((r) => r.willingness_to_pay !== "Kaum gratisan only.").length;
  const bayarPct = n ? Math.round((bayarCount / n) * 100) : 0;

  const radialData = [{ name: "Mau Bayar", value: bayarPct, fill: "#10b981" }];

  // ── Export CSV ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID", "Email", "Nama", "Jurusan/Semester", "Frekuensi Pencerahan", "Skala Tampilan", "3 Kata", "Bagian Bingung", "Request Materi", "Fitur Chat", "Alur Kreator", "WTP", "Mau Kreator", "Kritik Saran", "Submitted At"];
    const rows = data.map((r) => [
      r.id, r.email, r.nama, r.jurusan_semester,
      r.frekuensi_butuh_pencerahan, r.kesan_tampilan_skala,
      r.tiga_kata, `${r.bagian_bingung}${r.bagian_bingung_custom ? ` — ${r.bagian_bingung_custom}` : ""}`,
      `${r.request_materi_mudah}${r.request_materi_custom ? ` — ${r.request_materi_custom}` : ""}`,
      `${r.fitur_chat_berguna}${r.fitur_chat_custom ? ` — ${r.fitur_chat_custom}` : ""}`,
      r.alur_kreator, r.willingness_to_pay, r.mau_jadi_kreator, r.kritik_saran,
      r.submitted_at?.toDate?.()?.toLocaleString("id-ID") || "",
    ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`));

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kuesioner_tukarilmu_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080814] text-white [background-image:radial-gradient(ellipse_70%_50%_at_10%_0%,rgba(99,102,241,0.18)_0%,transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_100%,rgba(236,72,153,0.1)_0%,transparent_55%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Admin Only
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">Hasil Kuesioner</h1>
            <p className="text-white/40 mt-1 font-medium">TukarIlmu MVP Testing Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => { await fetchData(); }}
              disabled={refreshing}
              className="flex items-center gap-2 text-sm font-semibold text-white/60 border border-white/12 px-4 py-2.5 rounded-full hover:bg-white/6 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </motion.div>

        {n === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-white/40 font-semibold">Belum ada responden nih. Sebar kuesionernya dulu!</p>
          </div>
        ) : (
          <>
            {/* ── Stat cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total Responden" value={n} sub="orang udah ngisi" color="#6366f1" />
              <StatCard icon={Star} label="Avg Rating UI" value={`${avgStar.toFixed(1)} / 5`} sub="kesan tampilan" color="#f59e0b" />
              <StatCard icon={TrendingUp} label="Mau Bayar" value={`${bayarPct}%`} sub="bukan kaum gratisan" color="#10b981" />
              <StatCard icon={Zap} label="Calon Kreator" value={`${kreatorPct}%`} sub="mau gas jadi kreator" color="#ec4899" />
            </div>

            {/* ── Row 1: Frekuensi + Star dist ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard>
                <SectionHeader emoji="📚" title="Seberapa Sering Butuh Pencerahan?" count={n} />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={frekData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={200} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard>
                <SectionHeader emoji="⭐" title="Distribusi Rating Tampilan" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[1,2,3,4,5].map(s => ({ name: `${s} ⭐`, value: data.filter(r => r.kesan_tampilan_skala === s).length }))} margin={{ left: 0, right: 8 }}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[1,2,3,4,5].map((_, i) => (
                        <Cell key={i} fill={["#ef4444","#f97316","#f59e0b","#84cc16","#10b981"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-white/40 text-xs mt-2 font-medium">
                  Rata-rata: <span className="text-amber-400 font-bold">{avgStar.toFixed(2)}</span> bintang
                </p>
              </ChartCard>
            </div>

            {/* ── Row 2: Bagian bingung + Request materi ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard>
                <SectionHeader emoji="😵" title="Bagian yang Bikin Bingung" />
                <HorizBar data={bingungData} color="#ec4899" />
                {data.filter(r => r.bagian_bingung_custom).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <p className="text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Yang ketik sendiri:</p>
                    {data.filter(r => r.bagian_bingung_custom).map((r, i) => (
                      <p key={i} className="text-xs text-white/55 mb-1">· {r.bagian_bingung_custom}</p>
                    ))}
                  </div>
                )}
              </ChartCard>

              <ChartCard>
                <SectionHeader emoji="📥" title="Request Materi — Mudah?" />
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={requestData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {requestData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 12 }} itemStyle={{ color: "#fff" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Row 3: Chat + Kreator pie ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <ChartCard className="lg:col-span-1">
                <SectionHeader emoji="💬" title="Fitur Chat Berguna?" />
                <HorizBar data={chatData} color="#3b82f6" />
              </ChartCard>

              <ChartCard className="lg:col-span-1">
                <SectionHeader emoji="💰" title="Willingness to Pay" />
                <HorizBar data={wtpData} color="#10b981" />
              </ChartCard>

              <ChartCard className="lg:col-span-1">
                <SectionHeader emoji="🎬" title="Mau Jadi Kreator?" />
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={kreatorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {kreatorData.map((_, i) => <Cell key={i} fill={["#10b981", "#f59e0b", "#ef4444"][i % 3]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 12 }} itemStyle={{ color: "#fff" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Word cloud ───────────────────────────────────────────── */}
            <ChartCard className="mb-4">
              <SectionHeader emoji="💬" title="3 Kata Kesan Pertama — Word Cloud" count={tigaKataTexts.length} />
              <WordCloud texts={tigaKataTexts} />
            </ChartCard>

            {/* ── Esai: Alur kreator ───────────────────────────────────── */}
            <ChartCard className="mb-4">
              <SectionHeader emoji="🎨" title="Pengalaman Alur Kreator" count={esaiKreator.length} />
              <EsaiCard items={esaiKreator} />
            </ChartCard>

            {/* ── Esai: Kritik & Saran ─────────────────────────────────── */}
            <ChartCard className="mb-8">
              <SectionHeader emoji="🌶️" title="Kritik & Saran Pedas" count={esaiKritik.length} />
              <EsaiCard items={esaiKritik} />
            </ChartCard>

            {/* ── Raw table ────────────────────────────────────────────── */}
            <ChartCard>
              <SectionHeader emoji="📋" title="Semua Responden" count={n} />
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      {["Nama", "Email", "Jurusan/Sem", "Rating UI", "WTP", "Kreator?", "Submitted"].map((h) => (
                        <th key={h} className="text-left py-3 px-3 text-white/35 font-bold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={r.id} className={`border-b border-white/5 transition-colors hover:bg-white/3 ${i % 2 === 0 ? "" : "bg-white/2"}`}>
                        <td className="py-3 px-3 font-semibold text-white/80">{r.nama || "—"}</td>
                        <td className="py-3 px-3 text-white/40 max-w-[150px] truncate">{r.email}</td>
                        <td className="py-3 px-3 text-white/60">{r.jurusan_semester || "—"}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-amber-400">{"⭐".repeat(r.kesan_tampilan_skala || 0)}</span>
                        </td>
                        <td className="py-3 px-3 text-white/60 max-w-[120px] truncate">{r.willingness_to_pay || "—"}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${r.mau_jadi_kreator === "Gas, mau banget!" ? "bg-emerald-500/20 text-emerald-400" : r.mau_jadi_kreator?.includes("Engga") ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                            {r.mau_jadi_kreator?.split(",")[0] || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white/35">
                          {r.submitted_at?.toDate?.()?.toLocaleDateString("id-ID") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}