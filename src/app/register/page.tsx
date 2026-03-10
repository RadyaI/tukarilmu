"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, BookOpen, Sparkles, Video, Users } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { registerWithEmail, loginWithGoogle } from "../../utils/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      toast.success("Akun berhasil dibuat!");
      router.push("/explore");
    } catch (error: any) {
      Swal.fire({
        title: 'Oops!',
        text: error.message || 'Gagal mendaftar, email mungkin sudah digunakan.',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold cursor-pointer' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await loginWithGoogle();
      toast.success("Berhasil mendaftar dengan Google!");
      router.push("/explore");
    } catch (error: any) {
      toast.error("Gagal mendaftar dengan Google.");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      <Toaster position="top-center" />

      <div className="hidden lg:flex w-1/2 relative bg-violet-50 items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-[pulse_8s_ease-in-out_infinite]"></div>

        <div className="relative z-10 p-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/" className="inline-flex items-center gap-3 text-4xl font-extrabold text-indigo-600 mb-8 cursor-pointer">
              <BookOpen className="w-10 h-10" /> TukarIlmu.
            </Link>
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-6">
              Mulai Perjalanan <br /> Belajarmu <br /> Hari Ini
            </h1>
            <p className="text-lg text-slate-600 mb-12">
              Gabung dengan banyak mahasiswa lainnya. Temukan materi yang pas, bagikan ilmu, dan raih nilai terbaik.
            </p>

            <div className="space-y-6">
              <motion.div whileHover={{ x: 10 }} className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Upload Karyamu</h3>
                  <p className="text-sm text-slate-500">Bantu teman sambil tambah penghasilan.</p>
                </div>
              </motion.div>
              
              <motion.div whileHover={{ x: 10 }} className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Akses Tanpa Batas</h3>
                  <p className="text-sm text-slate-500">Materi gratis dan premium berkualitas.</p>
                </div>
              </motion.div>

              <motion.div whileHover={{ x: 10 }} className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm">
                <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center text-fuchsia-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Bangun Portofolio</h3>
                  <p className="text-sm text-slate-500">Buktikan pemahaman materimu.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute top-[30%] left-[10%] w-72 h-72 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-[pulse_7s_ease-in-out_infinite] lg:hidden"></div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-extrabold text-indigo-600 mb-2 cursor-pointer">
              <BookOpen className="w-8 h-8" /> TukarIlmu.
            </Link>
            <p className="text-slate-500">Gabung sekarang dan mulai belajar bareng.</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Daftar Akun Baru</h2>
            <p className="text-slate-500">Lengkapi data di bawah ini untuk bergabung ke TukarIlmu.</p>
          </div>

          <form onSubmit={handleEmailRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 font-medium"
                  placeholder="Budi Santoso"
                />
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 font-medium"
                  placeholder="maba@kampus.ac.id"
                />
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 font-medium"
                  placeholder="Minimal 6 karakter"
                />
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? "Mendaftar..." : "Buat Akun"} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-sm font-medium text-slate-400">Atau daftar dengan</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleRegister}
            className="w-full mt-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-slate-500 text-sm font-medium">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer">
              Masuk di sini
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}