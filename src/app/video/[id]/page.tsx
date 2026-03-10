"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowLeft, Tag, Heart, Share2, ShoppingCart, UserCircle, Lock, CheckCircle2, GraduationCap } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getVideoById } from "../../../utils/videos";
import { checkHasPurchased, buyMaterial, getAuthorInfo, incrementLike } from "../../../utils/purchases";
import { Video } from "../../../types/video";

export default function VideoDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [video, setVideo] = useState<(Video & { id: string }) | null>(null);
  const [author, setAuthor] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const videoId = params.id as string;
      const videoData = await getVideoById(videoId);
      
      if (!videoData) {
        router.push("/not-found");
        return;
      }
      setVideo(videoData);

      const authorData = await getAuthorInfo(videoData.userId);
      setAuthor(authorData);

      const likedStatus = localStorage.getItem(`liked_video_${videoId}`);
      if (likedStatus) setIsLiked(true);

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser && videoData.price > 0) {
          if (currentUser.uid === videoData.userId) {
            setHasPurchased(true);
          } else {
            const purchased = await checkHasPurchased(currentUser.uid, videoId);
            setHasPurchased(purchased);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initData();
  }, [params.id, router]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link materi berhasil disalin!", {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  const handleLike = async () => {
    if (isLiked || !video) return;
    try {
      await incrementLike("video", video.id);
      setIsLiked(true);
      setVideo({ ...video, likes: video.likes + 1 });
      localStorage.setItem(`liked_video_${video.id}`, "true");
      toast.success("Terima kasih atas apresiasinya!");
    } catch (error) {
      toast.error("Gagal menyukai video");
    }
  };

  const handleBuy = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!video) return;

    const confirm = await Swal.fire({
      title: 'Beli Materi Ini?',
      text: `Saldo/Pembayaran sebesar Rp ${video.price.toLocaleString('id-ID')} akan diproses.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Beli Sekarang',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (confirm.isConfirmed) {
      setIsProcessingBuy(true);
      toast.loading("Memproses pembelian...", { id: "buy-toast" });
      try {
        await buyMaterial(user.uid, "video", video.id, video.price);
        setHasPurchased(true);
        toast.success("Pembelian berhasil! Selamat belajar.", { id: "buy-toast" });
        Swal.fire({
          title: 'Berhasil! 🎉',
          text: 'Materi ini sudah ditambahkan ke keranjang belajarmu.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold' }
        });
      } catch (error) {
        toast.error("Gagal memproses pembelian.", { id: "buy-toast" });
      } finally {
        setIsProcessingBuy(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!video) return null;

  const isFree = video.price === 0;
  const canWatch = isFree || hasPurchased;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/explore" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Explore
          </Link>
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-2/3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-2xl border border-slate-800">
                {canWatch ? (
                  <video src={video.videoUrl} controls controlsList="nodownload" className="w-full h-full object-contain bg-black" poster={video.thumbnailUrl} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                    {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Materi Premium</h3>
                      <p className="text-slate-300 max-w-md mb-8">Video ini terkunci. Silakan beli akses untuk memutar penjelasan lengkap dari kreator.</p>
                      {!user ? (
                        <button onClick={() => router.push("/login")} className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/30 cursor-pointer">
                          Login untuk Membeli
                        </button>
                      ) : (
                        <button onClick={handleBuy} disabled={isProcessingBuy} className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full transition-all shadow-lg cursor-pointer flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" /> Beli Akses - Rp {video.price.toLocaleString('id-ID')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> {video.course}
                </span>
                {video.jurusan && (
                  <span className="px-3 py-1 bg-fuchsia-50 text-fuchsia-700 font-bold text-xs rounded-lg flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3" /> {video.jurusan}
                  </span>
                )}
                {isFree && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-lg">Gratis</span>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">{video.title}</h1>

              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                  {author?.avatar ? <img src={author.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : author?.name?.[0]?.toUpperCase() || <UserCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 line-clamp-1">{author?.name || "Kreator"}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {author?.role === 'admin' ? <CheckCircle2 className="w-3 h-3 text-indigo-500" /> : null}
                    {author?.tag || "Mahasiswa"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 mt-auto">
                <p className="text-sm text-slate-500 font-medium mb-2">Harga Akses Materi</p>
                <div className="text-4xl font-extrabold text-slate-900 mb-6">
                  {isFree ? "Gratis" : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(video.price)}
                </div>

                <div className="space-y-3">
                  {!canWatch ? (
                    <button onClick={handleBuy} disabled={isProcessingBuy} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">
                      <ShoppingCart className="w-5 h-5" /> {isProcessingBuy ? "Memproses..." : "Beli Materi Ini"}
                    </button>
                  ) : (
                    <button disabled className="w-full py-4 bg-green-50 text-green-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-green-200">
                      <CheckCircle2 className="w-5 h-5" /> Materi Sudah Dibuka
                    </button>
                  )}
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleLike}
                      disabled={isLiked}
                      className={`flex-1 py-3.5 font-semibold rounded-2xl transition-all border flex items-center justify-center gap-2 cursor-pointer ${isLiked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} /> {video.likes} Membantu
                    </button>
                    <button onClick={handleShare} className="flex-1 py-3.5 bg-slate-50 text-slate-600 font-semibold rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer">
                      <Share2 className="w-4 h-4" /> Bagikan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Deskripsi Materi</h2>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm">
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {video.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}