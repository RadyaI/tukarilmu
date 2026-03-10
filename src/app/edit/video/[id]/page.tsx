"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Video as VideoIcon, UploadCloud, X, ArrowRight, Image as ImageIcon, ChevronDown, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { auth } from "../../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getVideoById, updateVideoMetadata } from "../../../../utils/videos";
import { JURUSAN_LIST, Jurusan } from "../../../../types/jurusan";

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [jurusan, setJurusan] = useState<Jurusan | "">("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      
      if (params.id && typeof params.id === "string") {
        const videoData = await getVideoById(params.id);
        if (videoData) {
          if (videoData.userId !== currentUser.uid) {
            router.push("/my-posts");
            return;
          }
          setTitle(videoData.title);
          setCourse(videoData.course);
          setJurusan(videoData.jurusan as Jurusan);
          setDescription(videoData.description);
          setPrice(videoData.price);
          setExistingVideoUrl(videoData.videoUrl);
          if (videoData.thumbnailUrl) setExistingThumbnailUrl(videoData.thumbnailUrl);
        } else {
          router.push("/not-found");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [params.id, router]);

  const generateSHA1 = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= 1200);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Ukuran video maksimal 200MB");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    const isDurationValid = await checkVideoDuration(file);
    if (!isDurationValid) {
      toast.error("Durasi video maksimal 20 menit");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    setVideoFile(file);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran thumbnail maksimal 5MB");
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      return;
    }
    setThumbnailFile(file);
  };

  const uploadToCloudinary = async (file: File, resourceType: "video" | "image" = "video") => {
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

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gagal upload ke Cloudinary");
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jurusan) {
      toast.error("Silakan pilih jurusan terlebih dahulu");
      return;
    }

    setIsUploading(true);

    try {
      let finalThumbnailUrl = existingThumbnailUrl;
      let finalVideoUrl = existingVideoUrl;

      if (thumbnailFile) {
        toast.loading("Sedang mengunggah thumbnail baru...", { id: "edit-toast" });
        finalThumbnailUrl = await uploadToCloudinary(thumbnailFile, "image");
      }

      if (videoFile) {
        toast.loading("Sedang mengunggah video baru...", { id: "edit-toast" });
        finalVideoUrl = await uploadToCloudinary(videoFile, "video");
      }

      toast.loading("Menyimpan perubahan...", { id: "edit-toast" });
      
      const updateData: any = {
        title,
        description,
        course,
        jurusan,
        price: Number(price),
        videoUrl: finalVideoUrl
      };

      if (finalThumbnailUrl) {
        updateData.thumbnailUrl = finalThumbnailUrl;
      }

      await updateVideoMetadata(params.id as string, updateData);

      toast.success("Materi berhasil diperbarui!", { id: "edit-toast" });
      router.push("/my-posts");

    } catch (error: any) {
      toast.error("Gagal memperbarui materi", { id: "edit-toast" });
      Swal.fire({
        title: "Oops!",
        text: error.message || "Terjadi kesalahan saat menyimpan perubahan.",
        icon: "error",
        confirmButtonColor: "#4f46e5",
        customClass: { popup: "rounded-3xl", confirmButton: "rounded-full px-6 py-2 font-bold cursor-pointer" }
      });
    } finally {
      setIsUploading(false);
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
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold mb-6 cursor-pointer">
          <ArrowLeft className="w-5 h-5" /> Kembali
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Edit Video</h1>
          <p className="text-slate-600">Perbarui informasi materi video kamu di sini.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Judul Materi</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mata Kuliah</label>
                  <input type="text" required value={course} onChange={(e) => setCourse(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Jurusan</label>
                  <div className="relative">
                    <select required value={jurusan} onChange={(e) => setJurusan(e.target.value as Jurusan)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 appearance-none cursor-pointer">
                      <option value="" disabled>Pilih...</option>
                      {JURUSAN_LIST.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Deskripsi Singkat</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Harga (Rp)</label>
                <input type="number" min="0" required value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Thumbnail</label>
                <div className="relative">
                  {!thumbnailFile && !existingThumbnailUrl ? (
                    <div onClick={() => thumbnailInputRef.current?.click()} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-500 font-medium">
                      <ImageIcon className="w-5 h-5 text-indigo-400" /> Ganti Gambar Thumbnail
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <ImageIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-800 truncate">{thumbnailFile ? thumbnailFile.name : "Thumbnail terpasang"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer">Ganti</button>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" ref={thumbnailInputRef} onChange={handleThumbnailChange} className="hidden" />
                </div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-semibold text-slate-700 mb-2 mt-4">Video Materi</label>
              {!videoFile && !existingVideoUrl ? (
                <div onClick={() => videoInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8 text-indigo-500" /></div>
                  <p className="font-bold text-slate-700 mb-1">Ganti video</p>
                </div>
              ) : (
                <div className="w-full border border-indigo-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 mt-4 gap-4">
                  <div className="flex items-center gap-4 truncate pr-4 w-full">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0"><VideoIcon className="w-6 h-6 text-white" /></div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{videoFile ? videoFile.name : "Video terpasang"}</p>
                      {videoFile && <p className="text-sm text-indigo-600 font-medium">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
                    </div>
                  </div>
                  <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full sm:w-auto px-6 py-2.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors shrink-0 cursor-pointer text-sm">Ganti Video</button>
                </div>
              )}
              <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoChange} className="hidden" />
            </motion.div>

            <div className="pt-6 border-t border-slate-100 mt-8">
              <button type="submit" disabled={isUploading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-lg">
                {isUploading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyimpan...</>) : (<>Simpan Perubahan <ArrowRight className="w-5 h-5" /></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}