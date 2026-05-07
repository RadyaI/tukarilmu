"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface FormData {
  nama: string;
  jurusan_semester: string;
  frekuensi_butuh_pencerahan: string;
  kesan_tampilan_skala: number;
  tiga_kata: string;
  bagian_bingung: string;
  bagian_bingung_custom: string;
  request_materi_mudah: string;
  request_materi_custom: string;
  fitur_chat_berguna: string;
  fitur_chat_custom: string;
  alur_kreator: string;
  willingness_to_pay: string;
  mau_jadi_kreator: string;
  kritik_saran: string;
}

const initialForm: FormData = {
  nama: "",
  jurusan_semester: "",
  frekuensi_butuh_pencerahan: "",
  kesan_tampilan_skala: 0,
  tiga_kata: "",
  bagian_bingung: "",
  bagian_bingung_custom: "",
  request_materi_mudah: "",
  request_materi_custom: "",
  fitur_chat_berguna: "",
  fitur_chat_custom: "",
  alur_kreator: "",
  willingness_to_pay: "",
  mau_jadi_kreator: "",
  kritik_saran: "",
};

const sections = [
  { id: 1, emoji: "👋", label: "Pemanasan", accent: "indigo" },
  { id: 2, emoji: "👀", label: "Kesan Pertama", accent: "pink" },
  { id: 3, emoji: "🧪", label: "Nyobain Fitur", accent: "amber" },
  { id: 4, emoji: "💰", label: "Validasi Bisnis", accent: "emerald" },
  { id: 5, emoji: "🌶️", label: "Kritik & Saran", accent: "red" },
];

// ─── Pill choice ─────────────────────────────────────────────────────────────
function PillChoice({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5 mt-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer
            ${value === opt
              ? "bg-indigo-500/25 border-indigo-400 text-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.3)] scale-[1.03]"
              : "bg-white/5 border-white/15 text-white/60 hover:bg-indigo-500/10 hover:border-indigo-400/50 hover:text-indigo-300 hover:scale-[1.02]"
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Star scale ──────────────────────────────────────────────────────────────
function StarScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Pusing lihatnya 😵", "Kurang oke nih", "Lumayan deh", "Cukup keren!", "Estetik & clean banget! 🔥"];
  return (
    <div className="mt-3">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="text-3xl transition-all duration-150 cursor-pointer bg-transparent border-none p-0.5"
            style={{
              filter: n <= (hover || value) ? "grayscale(0%) drop-shadow(0 0 6px #f59e0b)" : "grayscale(85%) opacity(0.4)",
              transform: n <= (hover || value) ? "scale(1.25)" : "scale(1)",
            }}
          >
            ⭐
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {(hover || value) > 0 && (
          <motion.p
            key={hover || value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm font-bold text-amber-400"
          >
            {labels[hover || value]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Short answer / textarea ─────────────────────────────────────────────────
function ShortAnswer({ placeholder, value, onChange, multiline = false }: { placeholder: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const base = "w-full mt-2.5 px-4 py-3 rounded-2xl bg-white/6 border border-white/12 text-slate-100 text-sm font-medium placeholder:text-white/30 outline-none transition-all duration-200 focus:border-indigo-400/70 focus:bg-indigo-500/8 focus:ring-2 focus:ring-indigo-500/15";
  if (multiline) return <textarea rows={4} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`${base} resize-none`} />;
  return <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={base} />;
}

// ─── Question block ──────────────────────────────────────────────────────────
function Q({ n, q, children }: { n: string; q: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <label className="flex items-start gap-2.5">
        <span className="shrink-0 w-6 h-6 mt-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-extrabold flex items-center justify-center">
          {n}
        </span>
        <span className="text-white font-semibold text-[0.95rem] leading-snug">{q}</span>
      </label>
      {children}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function KuesionerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      setUser(u);
      const snap = await getDocs(query(collection(db, "kuesioner_tukarilmu"), where("email", "==", u.email)));
      if (!snap.empty) setAlreadySubmitted(true);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const set = (key: keyof FormData, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const validate = (sec: number) => {
    if (sec === 1) {
      if (!form.nama.trim()) return "Isi nama panggilanmu dulu dong 😅";
      if (!form.jurusan_semester.trim()) return "Jurusan & semester juga dong!";
      if (!form.frekuensi_butuh_pencerahan) return "Pilih salah satu dulu ya~";
    }
    if (sec === 2) {
      if (!form.kesan_tampilan_skala) return "Kasih bintangnya dong! ⭐";
      if (!form.tiga_kata.trim()) return "Tiga kata ajaibnya mana?~";
      if (!form.bagian_bingung) return "Pilih salah satu ya!";
      if (form.bagian_bingung === "Ketik sendiri" && !form.bagian_bingung_custom.trim()) return "Ketik jawabanmu ya!";
    }
    if (sec === 3) {
      if (!form.request_materi_mudah) return "Pilih salah satu dulu~";
      if (form.request_materi_mudah === "Ketik sendiri" && !form.request_materi_custom.trim()) return "Ketik jawabanmu ya!";
      if (!form.fitur_chat_berguna) return "Gimana fitur chatnya? Pilih dong!";
      if (form.fitur_chat_berguna === "Ketik sendiri" && !form.fitur_chat_custom.trim()) return "Ketik jawabanmu ya!";
      if (!form.alur_kreator.trim()) return "Sharing dikit dong soal alur kreatornya~";
    }
    if (sec === 4) {
      if (!form.willingness_to_pay) return "Pilih range harga dulu ya!";
      if (!form.mau_jadi_kreator) return "Mau jadi kreator ga nih? Pilih!";
    }
    if (sec === 5) {
      if (!form.kritik_saran.trim()) return "Sarannya jangan dikosongkan, penting banget buat kami! 🙏";
    }
    return "";
  };

  const goNext = () => {
    const err = validate(currentSection);
    if (err) { setError(err); return; }
    setError("");
    setCurrentSection((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setError("");
    setCurrentSection((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const err = validate(5);
    if (err) { setError(err); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "kuesioner_tukarilmu"), {
        email: user.email,
        uid: user.uid,
        ...form,
        submitted_at: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setError("Waduh, ada error pas nyimpen data. Coba lagi ya!");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a18] flex items-center justify-center">
      <Loader2 className="w-9 h-9 text-indigo-400 animate-spin" />
    </div>
  );

  // ── Already submitted ────────────────────────────────────────────────────
  if (alreadySubmitted) return (
    <div className="min-h-screen bg-[#0a0a18] [background-image:radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(99,102,241,0.25)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(236,72,153,0.15)_0%,transparent_60%)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-md w-full text-center p-10 shadow-2xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Udah pernah ngisi nih!</h2>
        <p className="text-white/55 mb-7 leading-relaxed">Kamu udah mengisi kuesioner ini sebelumnya. Makasih ya udah bantu TukarIlmu berkembang! 🙏</p>
        <button onClick={() => router.push("/")} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-3 rounded-full hover:shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          Balik ke Beranda
        </button>
      </motion.div>
    </div>
  );

  // ── Success ──────────────────────────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-screen bg-[#0a0a18] [background-image:radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(99,102,241,0.25)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(236,72,153,0.15)_0%,transparent_60%)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-lg w-full text-center p-10 shadow-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 280 }} className="text-7xl mb-5">🚀</motion.div>
        <h2 className="text-3xl font-extrabold text-white mb-3">Mantap, {form.nama || "bro"}!</h2>
        <p className="text-white/65 text-base mb-2 leading-relaxed">Jawabanmu udah masuk & bakal jadi insight berharga buat TukarIlmu.</p>
        <p className="text-white/40 text-sm mb-8">Makasih udah luangin waktu dan ngebantu kami makin bagus.</p>
        <button onClick={() => router.push("/")} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-3 rounded-full hover:shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          Kembali ke TukarIlmu ✨
        </button>
      </motion.div>
    </div>
  );

  // ── Intro ────────────────────────────────────────────────────────────────
  if (currentSection === 0) return (
    <div className="min-h-screen bg-[#0a0a18] [background-image:radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(99,102,241,0.25)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(236,72,153,0.15)_0%,transparent_60%)] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 22 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-xl w-full p-10 text-center shadow-2xl">
        <div className="text-6xl mb-5">📋</div>
        <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" /> MVP Testing - TukarIlmu
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">Hei! 👀</h1>
        <p className="text-white/60 leading-relaxed mb-3 text-[0.95rem]">
          TukarIlmu lagi di tahap <span className="text-white font-semibold">MVP testing</span> dan pendapat kamu bakal nentuin arah pengembangannya ke depan.
        </p>
        <p className="text-white/60 leading-relaxed mb-8 text-[0.95rem]">
          Santai aja, ga ada jawaban bener atau salah. Estimasi: <span className="text-white font-semibold">3–5 menit</span> doang kok.
        </p>
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {sections.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-lg">{s.emoji}</div>
              <span className="text-[10px] text-white/35 font-semibold tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setCurrentSection(1)} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-3.5 rounded-full text-base hover:shadow-[0_0_28px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          Gas! 🔥
        </button>
        <p className="text-white/25 text-xs mt-4">Login sebagai: {user?.email}</p>
      </motion.div>
    </div>
  );

  // ── Section questions ────────────────────────────────────────────────────
  const sec = sections[currentSection - 1];
  const totalSections = sections.length;
  const progress = (currentSection / totalSections) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a18] [background-image:radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(99,102,241,0.25)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(236,72,153,0.15)_0%,transparent_60%)] flex flex-col items-center pt-8 pb-16 px-4">

      {/* Progress area */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-between text-xs text-white/40 font-medium mb-2">
          <span>Bagian {currentSection} dari {totalSections}</span>
          <span>{Math.round(progress)}% selesai</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all
                ${i + 1 === currentSection ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-300"
                  : i + 1 < currentSection ? "bg-white/8 border-white/15 text-white/50"
                  : "bg-transparent border-white/10 text-white/25"}`}
            >
              {i + 1 < currentSection && <CheckCircle2 className="w-3 h-3" />}
              {s.emoji} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -48 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center text-2xl">
              {sec.emoji}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">{`Bagian ${currentSection}`}</p>
              <h2 className="text-xl font-extrabold text-white">{sec.label}</h2>
            </div>
          </div>

          {/* ── Section 1 ─────────────────────────────────────────── */}
          {currentSection === 1 && (
            <div className="space-y-7">
              <Q n="1" q="Nama panggilanmu siapa?">
                <ShortAnswer placeholder="e.g. Budi, Siska, Koko..." value={form.nama} onChange={(v) => set("nama", v)} />
              </Q>
              <Q n="2" q="Sekarang lagi sibuk kuliah di jurusan apa & semester berapa?">
                <ShortAnswer placeholder="e.g. Teknik Informatika, Semester 5" value={form.jurusan_semester} onChange={(v) => set("jurusan_semester", v)} />
              </Q>
              <Q n="3" q={'Seberapa sering kamu ngerasa "Duh materi dosen cepet banget, butuh dijelasin lebih"?'}>
                <PillChoice
                  options={["Tiap hari!", "Lumayan sering pas mau ujian aja", "Jarang sih, dosen gue jago", "Ga pernah, gue yang ngajarin dosennya"]}
                  value={form.frekuensi_butuh_pencerahan}
                  onChange={(v) => set("frekuensi_butuh_pencerahan", v)}
                />
              </Q>
            </div>
          )}

          {/* ── Section 2 ─────────────────────────────────────────── */}
          {currentSection === 2 && (
            <div className="space-y-7">
              <Q n="4" q="Kesan pertama pas buka web TukarIlmu. Gimana tampilannya?">
                <StarScale value={form.kesan_tampilan_skala} onChange={(v) => set("kesan_tampilan_skala", v)} />
              </Q>
              <Q n="5" q="Coba sebutin 3 kata yang langsung kepikiran pas lihat web ini!">
                <ShortAnswer placeholder="e.g. Keren, Bersih, Informatif" value={form.tiga_kata} onChange={(v) => set("tiga_kata", v)} />
              </Q>
              <Q n="6" q={'Ada bagian yang bikin kamu bingung nebak "Ini tombol fungsinya buat apa ya?"'}>
                <PillChoice
                  options={["Aman semua kok", "Ada dikit di bagian navigasi", "Bingung banget, tolong woy!", "Ketik sendiri"]}
                  value={form.bagian_bingung}
                  onChange={(v) => set("bagian_bingung", v)}
                />
                {form.bagian_bingung === "Ketik sendiri" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                    <ShortAnswer placeholder="Ceritain bagian yang bingungnya..." value={form.bagian_bingung_custom} onChange={(v) => set("bagian_bingung_custom", v)} />
                  </motion.div>
                )}
              </Q>
            </div>
          )}

          {/* ── Section 3 ─────────────────────────────────────────── */}
          {currentSection === 3 && (
            <div className="space-y-7">
              <Q n="7" q={'Pas nyobain fitur "Request Materi", kerasa gampang ga prosesnya?'}>
                <PillChoice
                  options={["Gampang banget, sat-set!", "Lumayan, tapi bisa dibikin lebih simpel", "Ribet, muter-muter.", "Ketik sendiri"]}
                  value={form.request_materi_mudah}
                  onChange={(v) => set("request_materi_mudah", v)}
                />
                {form.request_materi_mudah === "Ketik sendiri" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                    <ShortAnswer placeholder="Ceritain pengalamanmu..." value={form.request_materi_custom} onChange={(v) => set("request_materi_custom", v)} />
                  </motion.div>
                )}
              </Q>
              <Q n="8" q={'Menurut kamu, fitur "Chat" ngebantu banget ga sih buat nanya-nanya ke kreatornya langsung?'}>
                <PillChoice
                  options={["Ngebantu banget!", "Lumayan lah buat nanya revisi", "Kayaknya ga terlalu kepake deh.", "Ketik sendiri"]}
                  value={form.fitur_chat_berguna}
                  onChange={(v) => set("fitur_chat_berguna", v)}
                />
                {form.fitur_chat_berguna === "Ketik sendiri" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                    <ShortAnswer placeholder="Pendapat lain?" value={form.fitur_chat_custom} onChange={(v) => set("fitur_chat_custom", v)} />
                  </motion.div>
                )}
              </Q>
              <Q n="9" q="Kalo kamu jadi kreator yang upload materi (video/teks markdown), ngerasa alurnya udah enak belum? Ada keluhan?">
                <ShortAnswer placeholder="Ceritain pengalamanmu jadi kreator di sini..." value={form.alur_kreator} onChange={(v) => set("alur_kreator", v)} multiline />
              </Q>
            </div>
          )}

          {/* ── Section 4 ─────────────────────────────────────────── */}
          {currentSection === 4 && (
            <div className="space-y-7">
              <Q n="10" q="Kalo ada materi yang bener-bener kamu butuhin banget buat lulus/ujian matkul ini, kamu rela bayar berapa di TukarIlmu?">
                <PillChoice
                  options={["Rp5.000 - Rp15.000", "Rp15.000 - Rp30.000", "> Rp30.000 (kalo emang dewa banget materinya)", "Kaum gratisan only."]}
                  value={form.willingness_to_pay}
                  onChange={(v) => set("willingness_to_pay", v)}
                />
              </Q>
              <Q n="11" q="Tergiur ga sih buat jadi kreator di sini buat nambah uang jajan?">
                <PillChoice
                  options={["Gas, mau banget!", "Boleh dicoba kalo lagi senggang", "Engga deh."]}
                  value={form.mau_jadi_kreator}
                  onChange={(v) => set("mau_jadi_kreator", v)}
                />
              </Q>
            </div>
          )}

          {/* ── Section 5 ─────────────────────────────────────────── */}
          {currentSection === 5 && (
            <div className="space-y-7">
              <Q n="12" q="Kira-kira nih, apa 1 hal yang wajib banget diubah atau ditambahin sebelum web ini beneran rilis ke publik?">
                <ShortAnswer placeholder="Jujur aja" value={form.kritik_saran} onChange={(v) => set("kritik_saran", v)} multiline />
              </Q>
              <div className="rounded-2xl p-5 text-center bg-indigo-500/10 border border-indigo-400/20">
                <p className="text-white/65 text-sm leading-relaxed">
                  🙏 Makasih udah sampe sini!
                </p>
                <p className="text-white/35 text-xs mt-1">Dadaah</p>
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-5 bg-red-500/12 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/8">
            {currentSection > 1 ? (
              <button onClick={goPrev} className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white/80 border border-white/12 hover:border-white/25 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:bg-white/5">
                <ArrowLeft className="w-4 h-4" /> Sebelumnya
              </button>
            ) : <div />}

            {currentSection < totalSections ? (
              <button onClick={goNext} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-6 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                Lanjut <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-6 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer min-w-[150px] justify-center">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Nyimpen...</> : <>Kirim Jawaban 🚀</>}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}