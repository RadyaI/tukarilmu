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
  Sparkles,
  Shield,
  Edit3,
  X,
  Tag,
  Link2,
  Instagram,
  Linkedin,
  Globe,
  Plus,
  Briefcase,
  Trash2,
  Upload,
  FileUp,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { JURUSAN_LIST, Jurusan } from "@/types/jurusan";
import Swal from "sweetalert2";

const ANGKATAN_LIST = Array.from({ length: 12 }, (_, i) => (new Date().getFullYear() - i).toString());
const SEMESTER_LIST = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const tagStyles: Record<string, { bg: string; text: string; border: string }> = {
  "Mahasiswa": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Admin": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Mahasiswa Super": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Mahasiswa Aktif": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
};

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileType?: "image" | "pdf";
  link?: string;
  createdAt: number;
};

const compressImage = (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const MAX = 1600;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal kompres gambar"));
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioFileRef = useRef<HTMLInputElement>(null);

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

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDesc, setPortfolioDesc] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioFilePreview, setPortfolioFilePreview] = useState<string | null>(null);
  const [portfolioFileType, setPortfolioFileType] = useState<"image" | "pdf" | null>(null);
  const [portfolioLink, setPortfolioLink] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/login"); return; }
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
        setPortfolioItems(data.portfolioItems || []);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const generateSHA1 = async (message: string) => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(message));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const uploadToCloudinary = async (file: File, resourceType: "image" | "raw" = "image"): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDNAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_SECRET;
    if (!apiKey || !apiSecret || !cloudName) throw new Error("Konfigurasi Cloudinary tidak ditemukan");

    const timestamp = Math.round(Date.now() / 1000).toString();

    const signatureString = `timestamp=${timestamp}${apiSecret}`;
    const signature = await generateSHA1(signatureString);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    if (resourceType === "raw") {
      formData.append("resource_type", "raw");
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gagal upload file ke Cloudinary");
    return data.secure_url as string;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Ukuran foto maksimal 3MB"); return; }
    setNewAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePortfolioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") {
      // Swal.fire({
      //   title: "Upload PDF lagi bermasalah",
      //   icon: "error",
      //   confirmButtonText: "Oke"
      // })
      toast.error("Yah upload PDF nya lagi bermasalah deh")
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) { toast.error("Format file harus PDF, JPG, atau PNG"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Ukuran file maksimal 10MB"); return; }
    const isImage = file.type.startsWith("image/");
    setPortfolioFileType(isImage ? "image" : "pdf");
    setPortfolioFile(file);
    setPortfolioFilePreview(isImage ? URL.createObjectURL(file) : null);
  };

  const resetPortfolioModal = () => {
    setPortfolioTitle("");
    setPortfolioDesc("");
    setPortfolioFile(null);
    setPortfolioFilePreview(null);
    setPortfolioFileType(null);
    setPortfolioLink("");
    setShowPortfolioModal(false);
    if (portfolioFileRef.current) portfolioFileRef.current.value = "";
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleUploadPortfolio = async () => {
    if (!user) return;
    if (!portfolioTitle.trim()) { toast.error("Judul wajib diisi"); return; }

    const hasFile = !!portfolioFile;
    const hasLink = portfolioLink.trim().length > 0;

    if (!hasFile && !hasLink) { toast.error("Wajib isi minimal File atau Link"); return; }
    if (hasLink && !isValidUrl(portfolioLink.trim())) { toast.error("Format link tidak valid, pastiin pakai https://"); return; }

    setPortfolioUploading(true);
    toast.loading("Mengupload portfolio...", { id: "upload-portfolio" });

    try {
      let fileUrl: string | undefined;
      let fileType: "image" | "pdf" | undefined;

      if (hasFile) {
        if (portfolioFileType === "image") {
          const compressed = await compressImage(portfolioFile!, 0.8);
          fileUrl = await uploadToCloudinary(compressed, "image");
        } else {
          fileUrl = await uploadToCloudinary(portfolioFile!, "raw");
        }
        fileType = portfolioFileType!;
      }

      const newItem: PortfolioItem = {
        id: crypto.randomUUID(),
        title: portfolioTitle.trim(),
        description: portfolioDesc.trim(),
        ...(fileUrl && { fileUrl, fileType }),
        ...(hasLink && { link: portfolioLink.trim() }),
        createdAt: Date.now(),
      };

      const updated = [newItem, ...portfolioItems];
      await updateDoc(doc(db, "users", user.uid), { portfolioItems: updated });
      setPortfolioItems(updated);
      toast.success("Portfolio berhasil diupload!", { id: "upload-portfolio" });
      resetPortfolioModal();
    } catch (err: any) {
      toast.error(err.message || "Gagal upload portfolio", { id: "upload-portfolio" });
    } finally {
      setPortfolioUploading(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!user || !confirm("Yakin mau hapus portfolio ini?")) return;
    const updated = portfolioItems.filter(p => p.id !== id);
    try {
      await updateDoc(doc(db, "users", user.uid), { portfolioItems: updated });
      setPortfolioItems(updated);
      toast.success("Portfolio dihapus");
    } catch { toast.error("Gagal hapus portfolio"); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    toast.loading("Menyimpan profil...", { id: "save-profile" });
    try {
      let finalAvatarUrl = avatarPreview;
      if (newAvatarFile) finalAvatarUrl = await uploadToCloudinary(newAvatarFile, "image");
      const updateData: any = {
        name: name.trim(), phoneNumber: phone.trim(), bio: bio.trim(),
        kampus: kampus.trim(), jurusan: jurusan || null,
        angkatan: angkatan || null, semester: semester || null,
        igUrl: igUrl.trim(), linkedinUrl: linkedinUrl.trim(), portfolioUrl: portfolioUrl.trim(),
      };
      if (finalAvatarUrl) updateData.avatar = finalAvatarUrl;
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
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const tag = userData?.tag || "Mahasiswa";
  const tagStyle = tagStyles[tag] ?? tagStyles["Mahasiswa"];
  const isGoogleUser = userData?.provider === "google";
  const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2";
  const canSubmit = portfolioTitle.trim().length > 0 && (!!portfolioFile || portfolioLink.trim().length > 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1f2937",
            // border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "14px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          },

          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },

          error: {
            style: {
              background: "#CA0B00",
              color: "#ffffff"
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      { }
      <div className="absolute top-[-10%] left-[-5%] w-[45rem] h-[45rem] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[30rem] h-[30rem] bg-fuchsia-50/60 rounded-full blur-[100px] pointer-events-none" />

      { }
      <AnimatePresence>
        {showPortfolioModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) resetPortfolioModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              { }
              <div className="flex items-center justify-between px-7 pt-7 pb-5 shrink-0 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Upload Portfolio</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Wajib isi minimal satu: file atau link</p>
                </div>
                <button
                  type="button"
                  onClick={resetPortfolioModal}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              { }
              <div className="overflow-y-auto px-7 py-5 space-y-4 flex-1 overscroll-contain">

                { }
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Judul <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={portfolioTitle}
                    onChange={(e) => setPortfolioTitle(e.target.value)}
                    placeholder="Contoh: UI/UX Design App Toko Online"
                    maxLength={80}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{portfolioTitle.length}/80</p>
                </div>

                { }
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Deskripsi{" "}
                    <span className="text-slate-400 font-normal text-xs">(opsional)</span>
                  </label>
                  <textarea
                    value={portfolioDesc}
                    onChange={(e) => setPortfolioDesc(e.target.value)}
                    rows={3}
                    placeholder="Ceritain singkat tentang portfolio ini..."
                    maxLength={200}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm resize-none"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{portfolioDesc.length}/200</p>
                </div>

                { }
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">File & / atau Link</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                { }
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    File{" "}
                    <span className="text-slate-400 font-normal text-xs">PDF, JPG, PNG — maks 10MB</span>
                    {!portfolioLink.trim() && (
                      <span className="text-amber-500 text-xs font-semibold ml-1">*wajib jika tanpa link</span>
                    )}
                  </label>
                  <input
                    type="file"
                    ref={portfolioFileRef}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handlePortfolioFileChange}
                    className="hidden"
                  />
                  {!portfolioFile ? (
                    <button
                      type="button"
                      onClick={() => portfolioFileRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-6 flex flex-col items-center gap-2 transition-all cursor-pointer group"
                    >
                      <div className="w-11 h-11 bg-indigo-100 group-hover:bg-indigo-200 rounded-full flex items-center justify-center transition-colors">
                        <FileUp className="w-5 h-5 text-indigo-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Klik untuk pilih file</p>
                      <p className="text-xs text-slate-400">PDF, JPG, JPEG, PNG</p>
                    </button>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      {portfolioFileType === "image" && portfolioFilePreview ? (
                        <img src={portfolioFilePreview} alt="preview" className="w-full h-36 object-cover" />
                      ) : (
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{portfolioFile.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {(portfolioFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                            </p>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioFile(null);
                          setPortfolioFilePreview(null);
                          setPortfolioFileType(null);
                          if (portfolioFileRef.current) portfolioFileRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => portfolioFileRef.current?.click()}
                        className="absolute bottom-2 right-2 text-[10px] bg-white/90 hover:bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full shadow cursor-pointer transition-colors"
                      >
                        Ganti
                      </button>
                    </div>
                  )}
                </div>

                { }
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                    Link{" "}
                    <span className="text-slate-400 font-normal text-xs">Figma, GitHub, Drive, dsb</span>
                    {!portfolioFile && (
                      <span className="text-amber-500 text-xs font-semibold ml-1">*wajib jika tanpa file</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://figma.com/file/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                  />
                  {portfolioLink && !isValidUrl(portfolioLink) && (
                    <p className="text-xs text-red-400 mt-1 font-semibold">
                      Format link tidak valid, pastiin pakai https://
                    </p>
                  )}
                </div>

                { }
                <div className={`rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2 transition-colors ${!!portfolioFile && portfolioLink.trim()
                  ? "bg-emerald-50 text-emerald-700"
                  : !!portfolioFile || portfolioLink.trim()
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-amber-50 text-amber-700"
                  }`}>
                  <span className="mt-0.5 shrink-0">
                    {(!!portfolioFile || portfolioLink.trim()) ? "✅" : "⚠️"}
                  </span>
                  <span>
                    {!!portfolioFile && portfolioLink.trim()
                      ? "Keren! Kamu isi file sekaligus link."
                      : !!portfolioFile
                        ? "File sudah dipilih. Tambah link jika mau."
                        : portfolioLink.trim()
                          ? "Link sudah diisi. Tambah file jika mau."
                          : "Wajib isi minimal satu: file atau link."}
                  </span>
                </div>

                { }
                <div className="h-2" />
              </div>

              { }
              <div className="px-7 py-5 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUploadPortfolio}
                  disabled={portfolioUploading || !canSubmit}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-indigo-200 cursor-pointer text-sm"
                >
                  {portfolioUploading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengupload...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload Portfolio</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold mb-8 cursor-pointer group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
        </Link>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            { }
            <div className="lg:col-span-1 flex flex-col gap-6">
              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-8 flex flex-col items-center text-center"
              >
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
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer">
                    <Camera className="w-4 h-4" />
                  </button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">{name || "Nama Kamu"}</h2>
                <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}>
                  {userData?.role === "admin" ? <Shield className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />} {tag}
                </span>
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
                  ) : <><Mail className="w-4 h-4" /> Email & Password</>}
                </div>
                {!isGoogleUser && (
                  <Link href="/forgot-password" className="mt-4 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors underline underline-offset-2">
                    Ganti / Lupa Password?
                  </Link>
                )}
              </motion.div>

              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6"
              >
                <h3 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-500" /> Link Sosial
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: <Instagram className="w-3.5 h-3.5 text-pink-500" />, label: "Instagram", value: igUrl, set: setIgUrl, placeholder: "https://instagram.com/username" },
                    { icon: <Linkedin className="w-3.5 h-3.5 text-blue-600" />, label: "LinkedIn", value: linkedinUrl, set: setLinkedinUrl, placeholder: "https://linkedin.com/in/username" },
                    { icon: <Globe className="w-3.5 h-3.5 text-emerald-500" />, label: "Portfolio / Website", value: portfolioUrl, set: setPortfolioUrl, placeholder: "https://kamu.dev" },
                  ].map(({ icon, label, value, set, placeholder }) => (
                    <div key={label}>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">{icon} {label}</label>
                      <input type="url" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            { }
            <div className="lg:col-span-2 flex flex-col gap-6">
              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
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

              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8"
              >
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" /> Info Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}><User className="w-4 h-4 text-indigo-400" /> Nama Lengkap</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap kamu" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Phone className="w-4 h-4 text-indigo-400" /> No. HP <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}><FileText className="w-4 h-4 text-indigo-400" /> Bio Singkat <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span></label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Ceritain dikit tentang kamu" className={`${inputClass} resize-none`} maxLength={200} />
                    <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200</p>
                  </div>
                </div>
              </motion.div>

              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8"
              >
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-500" /> Info Pendidikan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}><Building2 className="w-4 h-4 text-violet-400" /> Nama Kampus <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span></label>
                    <input type="text" value={kampus} onChange={(e) => setKampus(e.target.value)} placeholder="Contoh: Universitas Brawijaya" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><BookOpen className="w-4 h-4 text-violet-400" /> Jurusan <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span></label>
                    <div className="relative">
                      <select value={jurusan} onChange={(e) => setJurusan(e.target.value as Jurusan)} className={selectClass}>
                        <option value="">Pilih Jurusan...</option>
                        {JURUSAN_LIST.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <GraduationCap className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}><Tag className="w-4 h-4 text-violet-400" /> Angkatan <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span></label>
                    <div className="relative">
                      <select value={angkatan} onChange={(e) => setAngkatan(e.target.value)} className={selectClass}>
                        <option value="">Pilih Angkatan...</option>
                        {ANGKATAN_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <Tag className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}><Sparkles className="w-4 h-4 text-violet-400" /> Semester Sekarang <span className="text-xs font-medium text-slate-400 ml-auto">(opsional)</span></label>
                    <div className="relative">
                      <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectClass}>
                        <option value="">Pilih Semester...</option>
                        {SEMESTER_LIST.map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                      <Sparkles className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>

              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-fuchsia-500" /> Portfolio
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{portfolioItems.length} item</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPortfolioModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-bold rounded-xl shadow transition-all hover:shadow-fuchsia-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>

                {portfolioItems.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="w-14 h-14 bg-fuchsia-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-fuchsia-300" />
                    </div>
                    <p className="text-slate-400 font-semibold text-sm">Belum ada portfolio.</p>
                    <p className="text-slate-400 text-xs mt-1">Klik "Tambah" buat upload karya pertama kamu 🚀</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="group relative bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                        { }
                        <div className="w-full h-32 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                          {item.fileType === "image" && item.fileUrl ? (
                            <img src={item.fileUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : item.fileType === "pdf" ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-500" />
                              </div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PDF</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <LinkIcon className="w-6 h-6 text-emerald-600" />
                              </div>
                              <span className="text-xs font-bold text-slate-500">Link Only</span>
                            </div>
                          )}
                          { }
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            {item.fileUrl && (
                              <a
                                href={item.fileType === "pdf"
                                  ? `https://docs.google.com/viewer?url=${encodeURIComponent(item.fileUrl)}`
                                  : item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:bg-indigo-50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title={item.fileType === "pdf" ? "Buka PDF via Google Docs Viewer" : "Buka gambar"}
                              >
                                <ExternalLink className="w-4 h-4 text-indigo-600" />
                              </a>
                            )}
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:bg-emerald-50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="Buka link"
                              >
                                <LinkIcon className="w-4 h-4 text-emerald-600" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePortfolio(item.id)}
                              className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        { }
                        <div className="p-4">
                          <p className="font-bold text-sm text-slate-800 line-clamp-1">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {item.fileType && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.fileType === "pdf" ? "bg-red-50 text-red-500" : "bg-indigo-50 text-indigo-500"}`}>
                                  {item.fileType === "pdf" ? "PDF" : "Gambar"}
                                </span>
                              )}
                              {item.link && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">Link</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              { }
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-70 cursor-pointer text-base"
                >
                  {saving
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                    : <><Save className="w-5 h-5" /> Simpan Perubahan</>
                  }
                </button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}