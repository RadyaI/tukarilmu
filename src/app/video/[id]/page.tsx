"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Tag,
  Heart,
  Share2,
  ShoppingCart,
  UserCircle,
  Lock,
  CheckCircle2,
  GraduationCap,
  X,
  Loader2,
  QrCode,
  Clock,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getVideoById } from "../../../utils/videos";
import {
  checkHasPurchased,
  buyMaterial,
  getAuthorInfo,
  incrementLike,
} from "../../../utils/purchases";
import { Video } from "../../../types/video";

// ─── Types ─────────────────────────────────────────────────────────────────

type PaymentStatus = "idle" | "creating" | "waiting" | "success" | "failed";

interface PaymentPayload {
  project: string;
  order_id: string;
  amount: number;
  fee: number;
  status: "pending" | "canceled" | "completed";
  total_payment: number;
  payment_method: string;
  payment_number: string | null;
  payment_url: string | null;
  redirect_url: string | null;
  expired_at: string | Date | null;
  completed_at: string | Date | null;
}

// ─── QRIS Modal Component ───────────────────────────────────────────────────

function QrisModal({
  payment,
  onSuccess,
  onClose,
}: {
  payment: PaymentPayload;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [polling, setPolling] = useState(true);
  const [status, setStatus] = useState<"pending" | "canceled" | "completed">("pending");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR lokal dari payment_number (QRIS string)
  useEffect(() => {
    const qrString = payment.payment_number || payment.payment_url;
    console.log("payment_number:", payment.payment_number);
    console.log("payment_url:", payment.payment_url);
    console.log("qrString yang dipakai:", qrString);
    if (!qrString) return;
    QRCode.toDataURL(qrString, {
      width: 240,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("[QrisModal] QR generate error:", err));
  }, [payment.payment_number, payment.payment_url]);

  // Countdown timer expired
  useEffect(() => {
    if (!payment.expired_at) return;
    const expiredMs = new Date(payment.expired_at).getTime();
    const interval = setInterval(() => {
      const diff = Math.max(0, expiredMs - Date.now());
      setTimeLeft(Math.floor(diff / 1000));
      if (diff <= 0) {
        clearInterval(interval);
        setPolling(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [payment.expired_at]);

  // Polling status tiap 4 detik
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: payment.order_id,
          amount: payment.amount,
        }),
      });
      const data = await res.json();
      if (data?.payment?.status === "completed") {
        setStatus("completed");
        setPolling(false);
        onSuccess();
      } else if (data?.payment?.status === "canceled") {
        setStatus("canceled");
        setPolling(false);
      }
    } catch (_) { }
  }, [payment.order_id, payment.amount, onSuccess]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [polling, poll]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 pt-6 pb-8 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <p className="text-slate-300 text-sm mb-1">Bayar via QRIS</p>
          <p className="text-2xl font-extrabold">
            {formatRupiah(payment.total_payment)}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            sudah termasuk biaya layanan
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* Status: Berhasil */}
            {status === "completed" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-bold text-slate-900 text-lg">Pembayaran Berhasil!</p>
                <p className="text-slate-500 text-sm mt-1">Materi sudah bisa diakses</p>
              </motion.div>
            )}

            {/* Status: Dibatalkan */}
            {status === "canceled" && (
              <motion.div
                key="canceled"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="font-bold text-slate-900">Transaksi Dibatalkan</p>
                <p className="text-slate-500 text-sm mt-1">Silakan coba lagi</p>
              </motion.div>
            )}

            {/* Status: Pending — tampilkan QR */}
            {status === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <div className={`p-3 border-2 rounded-2xl transition-all ${isExpired ? "border-red-200 opacity-40 grayscale" : "border-slate-100"}`}>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QRIS Code" className="w-48 h-48 rounded-lg" />
                    ) : (
                      <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer */}
                {timeLeft !== null && (
                  <div className="flex items-center justify-center mb-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${isExpired ? "bg-red-100 text-red-600" : timeLeft < 60 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                      }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {isExpired ? "QR sudah kadaluarsa" : `Kadaluarsa dalam ${formatTime(timeLeft)}`}
                    </div>
                  </div>
                )}

                {/* Polling / expired indicator */}
                {isExpired ? (
                  <div className="flex items-center justify-center gap-2 text-red-400 text-xs mb-4">
                    <X className="w-3 h-3" />
                    QR ini sudah tidak bisa digunakan
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs mb-4">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Menunggu konfirmasi pembayaran...
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500 text-center">
                    Scan QR di atas dengan aplikasi{" "}
                    <span className="font-semibold text-slate-700">
                      GoPay, OVO, Dana, ShopeePay
                    </span>{" "}
                    atau m-banking manapun yang support QRIS
                  </p>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VideoDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [video, setVideo] = useState<(Video & { id: string }) | null>(null);
  const [author, setAuthor] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [activePayment, setActivePayment] = useState<PaymentPayload | null>(
    null
  );

  const tagStyles: Record<string, string> = {
    Mahasiswa: "bg-blue-50 text-blue-700",
    Admin: "bg-red-50 text-red-700",
    "Mahasiswa Super": "bg-amber-50 text-amber-700",
    "Mahasiswa Aktif": "bg-indigo-50 text-indigo-700",
  };

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
            const purchased = await checkHasPurchased(
              currentUser.uid,
              videoId
            );
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
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
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

  // ── Beli via Pakasir ──────────────────────────────────────────────────────
  const handleBuy = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!video) return;

    setPaymentStatus("creating");

    try {
      // Format: uid_contentType_contentId_timestamp
      const orderId = `${user.uid}_video_${video.id}_${Date.now()}`;
      const redirectUrl = `${window.location.origin}/video/${video.id}?payment=success`;

      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: video.price,
          redirectUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat transaksi");
      }

      setActivePayment(data.payment);
      setPaymentStatus("waiting");
    } catch (error: any) {
      toast.error(error.message || "Gagal memulai pembayaran");
      setPaymentStatus("idle");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user || !video || !activePayment) return;

    try {
      // Tandai sebagai purchased di Firestore
      await buyMaterial(user.uid, video.userId, "video", video.id, video.price);
    } catch (_) {
      // Mungkin sudah ditandai via webhook, ignore
    }

    setHasPurchased(true);
    setPaymentStatus("success");

    toast.success("Pembayaran berhasil! Selamat belajar 🎉", {
      duration: 4000,
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
    });

    setTimeout(() => {
      setActivePayment(null);
      setPaymentStatus("idle");
    }, 2000);
  };

  const handleCloseModal = () => {
    setActivePayment(null);
    setPaymentStatus("idle");
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
  const isCreatingPayment = paymentStatus === "creating";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* QRIS Modal */}
      <AnimatePresence>
        {activePayment && paymentStatus === "waiting" && (
          <QrisModal
            payment={activePayment}
            onSuccess={handlePaymentSuccess}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Explore
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Video Player */}
            <div className="w-full lg:w-2/3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-2xl border border-slate-800"
              >
                {canWatch ? (
                  <video
                    src={video.videoUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-contain bg-black"
                    poster={video.thumbnailUrl}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt="Thumbnail"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        Materi Premium
                      </h3>
                      <p className="text-slate-300 max-w-md mb-8">
                        Video ini terkunci. Silakan beli akses untuk memutar
                        penjelasan lengkap dari kreator.
                      </p>
                      {!user ? (
                        <button
                          onClick={() => router.push("/login")}
                          className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/30 cursor-pointer"
                        >
                          Login untuk Membeli
                        </button>
                      ) : (
                        <button
                          onClick={handleBuy}
                          disabled={isCreatingPayment}
                          className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full transition-all shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-70"
                        >
                          {isCreatingPayment ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <QrCode className="w-5 h-5" />
                          )}
                          Bayar QRIS - Rp{" "}
                          {video.price.toLocaleString("id-ID")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar Info */}
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
                  <span className="px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-lg">
                    Gratis
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
                {video.title}
              </h1>

              <Link href={`../user/${author?.userId}`}>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                    {author?.avatar ? (
                      <img
                        src={author.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      author?.name?.[0]?.toUpperCase() || (
                        <UserCircle className="w-6 h-6" />
                      )
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-1">
                      {author?.name || "Kreator"}
                    </p>
                    <p
                      className={`w-fit p-2 rounded-lg text-xs ${tagStyles[author?.tag || "Mahasiswa"] ??
                        "bg-fuchsia-50 text-fuchsia-700"
                        } flex items-center gap-1`}
                    >
                      {author?.role === "admin" ? (
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                      ) : null}
                      {author?.tag || "Mahasiswa"}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Pricing Card */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 mt-auto">
                <p className="text-sm text-slate-500 font-medium mb-2">
                  Harga Akses Materi
                </p>
                <div className="text-4xl font-extrabold text-slate-900 mb-6">
                  {isFree
                    ? "Gratis"
                    : new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(video.price)}
                </div>

                <div className="space-y-3">
                  {!canWatch ? (
                    <button
                      onClick={handleBuy}
                      disabled={isCreatingPayment}
                      className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isCreatingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Menyiapkan QRIS...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-5 h-5" />
                          Bayar dengan QRIS
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-4 bg-green-50 text-green-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-green-200"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Materi Sudah Dibuka
                    </button>
                  )}

                  {/* Like & Share */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleLike}
                      disabled={isLiked}
                      className={`flex-1 py-3.5 font-semibold rounded-2xl transition-all border flex items-center justify-center gap-2 cursor-pointer ${isLiked
                          ? "bg-red-50 text-red-500 border-red-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`}
                      />
                      {video.likes} Membantu
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 py-3.5 bg-slate-50 text-slate-600 font-semibold rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" /> Bagikan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deskripsi */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Deskripsi Materi
          </h2>
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