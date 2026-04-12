"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Building2,
  FileText,
  Camera,
  Save,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Shield,
  Edit3,
  X,
  Tag,
  Link2,
  Instagram,
  Linkedin,
  Globe
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { JURUSAN_LIST, Jurusan } from "@/types/jurusan";

const ANGKATAN_LIST = Array.from({ length: 12 }, (_, i) => (new Date().getFullYear() - i).toString());
const SEMESTER_LIST = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const tagStyles: Record<string, { bg: string; text: string; border: string }> = {
  "Mahasiswa": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Admin": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Mahasiswa Super": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Mahasiswa Aktif": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [kampus, setKampus] = useState("");
  const [jurusan, setJurusan] = useState<Jurusan | "">("");
  const [angkatan, setAngkatan] = useState("");
  const [semester, setSemester] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setName(data.name || "");
        setPhone(data.phoneNumber || "");
        setBio(data.bio || "");
        setKampus(data.kampus || "");
        setJurusan(data.jurusan || "");
        setAngkatan(data.angkatan || "");
        setSemester(data.semester || "");
        setIgUrl(data.igUrl || "");
        setLinkedinUrl(data.linkedinUrl || "");
        setPortfolioUrl(data.portfolioUrl || "");
        setAvatarPreview(data.avatar || currentUser.photoURL || null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const generateSHA1 = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = "dmjcabiqr";
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_SECRET;
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    if (!apiKey || !apiSecret) throw new Error("Konfigurasi Cloudinary tidak ditemukan");
    const signatureString = `timestamp=${timestamp}${apiSecret}`;
    const signature = await generateSHA1(signatureString);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gagal upload foto");
    return data.secure_url;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 3MB");
      return;
    }
    setNewAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    toast.loading("Menyimpan profil...", { id: "save-profile" });

    try {
      let finalAvatarUrl = avatarPreview;

      if (newAvatarFile) {
        finalAvatarUrl = await uploadToCloudinary(newAvatarFile);
      }

      const updateData: any = {
        name: name.trim(),
        phoneNumber: phone.trim(),
        bio: bio.trim(),
        kampus: kampus.trim(),
        jurusan: jurusan || null,
        angkatan: angkatan || null,
        semester: semester || null,
        igUrl: igUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
      };

      if (finalAvatarUrl) {
        updateData.avatar = finalAvatarUrl;
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      setUserData({ ...userData, ...updateData });
      setNewAvatarFile(null);
      toast.success("Profil berhasil diperbarui!", { id: "save-profile" });
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan profil", { id: "save-profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const tag = userData?.tag || "Mahasiswa";
  const tagStyle = tagStyles[tag] ?? tagStyles["Mahasiswa"];
  const isGoogleUser = userData?.provider === "google";

  const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* bg blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45rem] h-[45rem] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[30rem] h-[30rem] bg-fuchsia-50/60 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Back nav */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </Link>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: Avatar + Tag card */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Avatar card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-8 flex flex-col items-center text-center"
              >
                {/* Avatar */}
                <div className="relative mb-5">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-indigo-200">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-4xl font-extrabold">
                        {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 mb-1">{name || "Nama Kamu"}</h2>
                <p className="text-sm text-slate-500 mb-4">{user?.email}</p>

                {/* Tag badge */}
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}>
                  {userData?.role === "admin" ? <Shield className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {tag}
                </span>

                {/* Provider badge */}
                <div className={`mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${isGoogleUser ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"}`}>
                  {isGoogleUser ? (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Terhubung via Google
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Email & Password
                    </>
                  )}
                </div>

                {/* Change password link (only for email/password users) */}
                {!isGoogleUser && (
                  <Link
                    href="/forgot-password"
                    className="mt-4 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors underline underline-offset-2"
                  >
                    Ganti / Lupa Password?
                  </Link>
                )}
              </motion.div>

              {/* Social links card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6"
              >
                <h3 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-500" /> Link Sosial
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
                    </label>
                    <input
                      type="url"
                      value={igUrl}
                      onChange={(e) => setIgUrl(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" /> Portfolio / Website
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://kamu.dev"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT: Main form */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2rem] p-8 text-white relative overflow-hidden"
              >
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-30%] left-[20%] w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <Edit3 className="w-5 h-5 text-white/80" />
                    <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Edit Profil</span>
                  </div>
                  <h1 className="text-3xl font-extrabold mb-2">Tunjukin Siapa Kamu 🎯</h1>
                  <p className="text-indigo-100 text-sm max-w-md">
                    Lengkapin profil kamu biar kreator lain dan pengguna TukarIlmu makin kenal kamu. Semua field di bawah bersifat opsional.
                  </p>
                </div>
              </motion.div>

              {/* Personal info card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8"
              >
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  Info Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      <User className="w-4 h-4 text-indigo-400" /> Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap kamu"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Phone className="w-4 h-4 text-indigo-400" /> No. HP
                      <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xx-xxxx-xxxx"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      <FileText className="w-4 h-4 text-indigo-400" /> Bio Singkat
                      <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Ceritain dikit tentang kamu"
                      className={`${inputClass} resize-none`}
                      maxLength={200}
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200</p>
                  </div>
                </div>
              </motion.div>

              {/* Education info card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8"
              >
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-500" />
                  Info Pendidikan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      <Building2 className="w-4 h-4 text-violet-400" /> Nama Kampus
                      <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={kampus}
                      onChange={(e) => setKampus(e.target.value)}
                      placeholder="Contoh: Universitas Brawijaya"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <BookOpen className="w-4 h-4 text-violet-400" /> Jurusan
                      <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={jurusan}
                        onChange={(e) => setJurusan(e.target.value as Jurusan)}
                        className={selectClass}
                      >
                        <option value="">Pilih Jurusan...</option>
                        {JURUSAN_LIST.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      <GraduationCap className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Tag className="w-4 h-4 text-violet-400" /> Angkatan
                      <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={angkatan}
                        onChange={(e) => setAngkatan(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Pilih Angkatan...</option>
                        {ANGKATAN_LIST.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <Tag className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Sparkles className="w-4 h-4 text-violet-400" /> Semester Sekarang
                      <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Pilih Semester...</option>
                        {SEMESTER_LIST.map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                      <Sparkles className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Save button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-70 cursor-pointer text-base"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}