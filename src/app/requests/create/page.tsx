"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Banknote,
  Calendar,
  ArrowRight,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { createRequest } from "../../../utils/requests";

export default function CreateRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !reward) {
      toast.error("Harap isi semua kolom wajib!");
      return;
    }

    const rewardNumber = parseInt(reward.replace(/\D/g, ""), 10);
    if (isNaN(rewardNumber) || rewardNumber < 0) {
      toast.error("Nominal reward tidak valid.");
      return;
    }

    if (deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(deadline);

      if (selectedDate < today) {
        toast.error("Tenggat waktu tidak boleh kurang dari hari ini!");
        return;
      }
    }

    setSubmitting(true);
    toast.loading("Membuat request...", { id: "create-req" });

    try {
      await createRequest(title, description, rewardNumber, user.uid, deadline);
      toast.success("Request berhasil dipublikasikan!", { id: "create-req" });
      router.push("/requests");
    } catch (error) {
      toast.error("Gagal membuat request. Coba lagi.", { id: "create-req" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value) {
      setReward(new Intl.NumberFormat('id-ID').format(parseInt(value, 10)));
    } else {
      setReward("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans pb-24">
      <Toaster position="top-center" />

      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-sky-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Link href="/requests" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold mb-8 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5" /> Kembali ke Request Board
        </Link>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md text-white font-bold text-sm rounded-full mb-6">
                <Sparkles className="w-4 h-4" /> Form Permintaan Materi
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Buat Request Baru</h1>
              <p className="text-indigo-100 text-lg max-w-xl">Jelaskan materi apa yang sedang kamu butuhkan, tentukan tenggat waktu, dan tawarkan reward untuk kreator yang bersedia membantu.</p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-12 flex flex-col gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <label className="block text-sm font-extrabold text-slate-700 mb-3">Judul Request <span className="text-red-500">*</span></label>
              <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <div className="pl-5 pr-4 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Penjelasan Algoritma Dijkstra di Mata Kuliah Struktur Data"
                  className="w-full py-4 pr-6 bg-transparent focus:outline-none text-slate-800 font-semibold"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <label className="block text-sm font-extrabold text-slate-700 mb-3">Deskripsi Lengkap <span className="text-red-500">*</span></label>
              <div className="flex w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <div className="pl-5 pr-4 pt-5">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan secara rinci bagian mana yang kamu kurang paham. Semakin detail, semakin mudah kreator membantumu..."
                  rows={5}
                  className="w-full py-5 pr-6 bg-transparent focus:outline-none text-slate-800 font-medium resize-none"
                ></textarea>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <label className="block text-sm font-extrabold text-slate-700 mb-3">Reward (Rp) <span className="text-red-500">*</span></label>
                <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                  <div className="pl-5 pr-3 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-slate-500 font-extrabold flex items-center justify-center pr-1">
                    Rp
                  </div>
                  <input
                    type="text"
                    required
                    value={reward}
                    onChange={handleRewardChange}
                    placeholder="15.000"
                    className="w-full py-4 pr-6 bg-transparent focus:outline-none text-slate-800 font-extrabold"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-3 ml-2">Tentukan nominal yang pantas untuk jerih payah kreator.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                <label className="block text-sm font-extrabold text-slate-700 mb-3">Tenggat Waktu (Opsional)</label>
                <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                  <div className="pl-5 pr-4 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full py-4 pr-6 bg-transparent focus:outline-none text-slate-800 font-semibold cursor-pointer"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-3 ml-2">Kapan maksimal kamu butuh materi ini?</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg rounded-2xl transition-all shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-70 cursor-pointer"
              >
                {submitting ? "Memproses Request..." : "Publikasikan Request"} <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
}