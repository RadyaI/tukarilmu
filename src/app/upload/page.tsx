"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getRequestById } from "../../utils/requests";
import { motion, AnimatePresence } from "framer-motion";
import { Video, FileText, UploadCloud, X, ArrowRight, Eye, Edit3, Image as ImageIcon, ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { addVideoMetadata } from "../../utils/videos";
import { addPostMetadata } from "../../utils/posts";
import { JURUSAN_LIST, Jurusan } from "../../types/jurusan";

type TabType = "video" | "post";
type PreviewType = "edit" | "preview";

function UploadFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>("video");
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [jurusan, setJurusan] = useState<Jurusan | "">("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [postContent, setPostContent] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewType>("edit");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchRequestReward = async () => {
      if (requestId) {
        const reqData: any = await getRequestById(requestId);
        if (reqData && reqData.reward) {
          setPrice(reqData.reward.toString());
        }
      }
    };

    fetchRequestReward();
  }, [requestId]);

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

  const generateSHA1 = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
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

    if (!apiKey || !apiSecret) {
      throw new Error("Konfigurasi Cloudinary tidak ditemukan");
    }

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
    if (!user) return;
    if (!jurusan) {
      toast.error("Silakan pilih jurusan terlebih dahulu");
      return;
    }

    setIsUploading(true);

    try {
      let uploadedThumbnailUrl = "";
      let newMaterialId = "";

      if (thumbnailFile) {
        toast.loading("Sedang mengunggah thumbnail...", { id: "upload-toast" });
        uploadedThumbnailUrl = await uploadToCloudinary(thumbnailFile, "image");
      }

      if (activeTab === "video") {
        if (!videoFile) {
          toast.error("Pilih video terlebih dahulu");
          setIsUploading(false);
          return;
        }

        toast.loading("Sedang mengunggah video ke server...", { id: "upload-toast" });
        const videoUrl = await uploadToCloudinary(videoFile, "video");

        toast.loading("Menyimpan data materi...", { id: "upload-toast" });
        newMaterialId = await addVideoMetadata({
          title,
          description,
          course,
          jurusan,
          userId: user.uid,
          authorName: user.displayName,
          price: Number(price),
          videoUrl,
          ...(uploadedThumbnailUrl && { thumbnailUrl: uploadedThumbnailUrl }),
          ...(requestId && { requestId })
        });
      } else {
        if (!postContent.trim()) {
          toast.error("Konten post tidak boleh kosong");
          setIsUploading(false);
          return;
        }

        toast.loading("Menyimpan artikel materi...", { id: "upload-toast" });
        newMaterialId = await addPostMetadata({
          title,
          description,
          course,
          jurusan,
          userId: user.uid,
          authorName: user.displayName,
          price: Number(price),
          content: postContent,
          ...(uploadedThumbnailUrl && { thumbnailUrl: uploadedThumbnailUrl }),
          ...(requestId && { requestId })
        });
      }

      if (requestId && newMaterialId) {
        toast.loading("Menautkan materi dengan request...", { id: "upload-toast" });
        const reqRef = doc(db, "requests", requestId);
        await updateDoc(reqRef, {
          status: "submitted",
          materialId: newMaterialId,
          type: activeTab
        });
      }

      toast.success("Materi berhasil diunggah!", { id: "upload-toast" });
      Swal.fire({
        title: "Berhasil!",
        text: "Materi kamu sudah tayang dan siap dipelajari mahasiswa lain.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
        customClass: { popup: "rounded-[2rem]", confirmButton: "rounded-full px-6 py-2 font-bold cursor-pointer" }
      }).then(() => {
        router.push(requestId ? "/my-requests" : "/explore");
      });

    } catch (error: any) {
      toast.error("Gagal mengunggah materi", { id: "upload-toast" });
      Swal.fire({
        title: "Oops!",
        text: error.message || "Terjadi kesalahan saat mengunggah materi.",
        icon: "error",
        confirmButtonColor: "#4f46e5",
        customClass: { popup: "rounded-[2rem]", confirmButton: "rounded-full px-6 py-2 font-bold cursor-pointer" }
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />

      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Bagikan Ilmu Kamu</h1>
          <p className="text-slate-600">Bantu mahasiswa lain memahami materi dan dapatkan penghasilan tambahan.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white p-6 sm:p-10">
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "video" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <Video className="w-4 h-4" /> Video Penjelasan
            </button>
            <button
              onClick={() => setActiveTab("post")}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "post" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <FileText className="w-4 h-4" /> Teks / Blog
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Judul Materi</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800"
                  placeholder="Contoh: Kalkulus Lanjut - Integral Lipat"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800"
                    placeholder="Contoh: Kalkulus"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Jurusan</label>
                  <div className="relative">
                    <select
                      required
                      value={jurusan}
                      onChange={(e) => setJurusan(e.target.value as Jurusan)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih Jurusan...</option>
                      {JURUSAN_LIST.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Deskripsi Singkat</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800 resize-none"
                placeholder="Jelaskan secara singkat apa yang akan dipelajari dalam materi ini..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Harga (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={!!requestId}
                  className={`w-full px-4 py-3.5 border rounded-2xl focus:outline-none transition-all font-medium ${requestId
                      ? "bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500 font-bold"
                      : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/50 text-slate-800"
                    }`}
                  placeholder="0 untuk gratis"
                />
                <p className="text-xs text-slate-500 mt-2">Isi 0 jika kamu ingin membagikan materi ini secara gratis.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Thumbnail (Opsional)</label>
                <div className="relative">
                  {!thumbnailFile ? (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-500 font-medium"
                    >
                      <ImageIcon className="w-5 h-5 text-indigo-400" /> Pilih Gambar Thumbnail
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <ImageIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-800 truncate">{thumbnailFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setThumbnailFile(null)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "video" ? (
                <motion.div
                  key="video-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-slate-700 mb-2 mt-4">Upload Video <span className="text-red-500">*</span></label>
                  {!videoFile ? (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="font-bold text-slate-700 mb-1">Klik untuk memilih video</p>
                      <p className="text-sm text-slate-500 text-center">Maksimal 20 Menit & 200MB (MP4, WebM)</p>
                    </div>
                  ) : (
                    <div className="w-full border border-indigo-100 rounded-[2rem] p-6 flex items-center justify-between bg-indigo-50 mt-4">
                      <div className="flex items-center gap-4 truncate pr-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{videoFile.name}</p>
                          <p className="text-sm text-indigo-600 font-medium">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="post-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2 mt-4">
                    <label className="block text-sm font-semibold text-slate-700">Konten Materi (Markdown) <span className="text-red-500">*</span></label>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("edit")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${previewMode === "edit" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("preview")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${previewMode === "preview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                    </div>
                  </div>

                  {previewMode === "edit" ? (
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={12}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm text-slate-800"
                      placeholder="# Judul Utama&#10;&#10;Kamu bisa menulis menggunakan format **Markdown** di sini.&#10;&#10;Contoh list:&#10;- Poin pertama&#10;- Poin kedua"
                    />
                  ) : (
                    <div className="w-full min-h-[18rem] px-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] overflow-y-auto">
                      {postContent ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold mt-6 mb-4 text-slate-900 border-b pb-2 border-slate-100" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-slate-800" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2 text-slate-800" {...props} />,
                            p: ({ node, ...props }) => <p className="text-slate-600 leading-relaxed mb-4 text-base" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-slate-600 mb-4 space-y-1" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                            a: ({ node, ...props }) => <a className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-300 underline-offset-2 transition-colors" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-slate-800" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-400 pl-4 py-1 italic text-slate-500 bg-slate-50 rounded-r-lg my-4" {...props} />,
                            code: ({ node, inline, className, children, ...props }: any) => {
                              return inline ? (
                                <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto mb-4 shadow-sm">
                                  <code className="text-slate-50 font-mono text-sm leading-relaxed" {...props}>
                                    {children}
                                  </code>
                                </div>
                              );
                            }
                          }}
                        >
                          {postContent}
                        </ReactMarkdown>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic">
                          Belum ada konten untuk ditampilkan preview.
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-6 border-t border-slate-100 mt-8">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-lg"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>Mempublikasikan Materi <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    }>
      <UploadFormContent />
    </Suspense>
  );
}