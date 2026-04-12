"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Send, CheckCircle2, BookOpen } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Masukkan email kamu dulu!");
      return;
    }

    setLoading(true);
    toast.loading("Mengirim email reset...", { id: "reset" });

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      toast.success("Email reset berhasil dikirim!", { id: "reset" });
    } catch (error: any) {
      let msg = "Gagal mengirim email. Coba lagi.";
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        msg = "Email tidak ditemukan di sistem kami.";
      }
      toast.error(msg, { id: "reset" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white relative overflow-hidden">
      <Toaster position="top-center" />

      {/* bg blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-100/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-100/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-80 h-80 bg-fuchsia-50/60 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-slate-100 p-8 sm:p-10"
              >
                <div className="mb-8">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Lupa Password?</h1>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Tenang, coba masukkan email yang kamu daftarkan dan kita kirimin link buat reset password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 font-medium"
                        placeholder="email@kampus.ac.id"
                      />
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Kirim Link Reset
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Balik ke Login
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-slate-100 p-8 sm:p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Cek Email Kamu! 📩</h2>
                <p className="text-slate-500 mb-2 text-sm leading-relaxed">
                  Link reset password udah kita kirim ke:
                </p>
                <p className="font-extrabold text-indigo-600 mb-6 text-sm bg-indigo-50 px-4 py-2 rounded-xl inline-block">{email}</p>
                <p className="text-xs text-slate-400 mb-8">
                  Cek juga folder spam ya, kadang nyasar ke sana 🙈. Link berlaku selama beberapa jam.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl transition-all border border-slate-200 cursor-pointer"
                  >
                    Kirim Ulang ke Email Lain
                  </button>
                  <Link
                    href="/login"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Kembali ke Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}