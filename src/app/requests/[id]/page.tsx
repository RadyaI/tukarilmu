"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    CheckCircle2,
    User,
    Clock,
    Wallet,
    ArrowRight,
    Share2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getRequestById, takeRequest } from "../../../utils/requests";

export default function RequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const requestId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTaking, setIsTaking] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        if (requestId) {
            loadRequestData();
        }

        return () => unsubscribe();
    }, [requestId]);

    const loadRequestData = async () => {
        setLoading(true);
        const data = await getRequestById(requestId);
        if (!data) {
            router.push("/requests");
            return;
        }
        setRequest(data);
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
    };

    const formatDate = (dateObj: any) => {
        if (!dateObj) return "-";
        const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link berhasil disalin!");
    };

    const handleTakeRequest = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (user.uid === request.requesterId) {
            toast.error("Kamu tidak bisa mengambil request buatanmu sendiri.");
            return;
        }

        const result = await Swal.fire({
            title: 'Ambil Request Ini?',
            text: "Pastikan kamu sanggup membuat materi sesuai permintaan dan tenggat waktu.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Ambil!',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-full px-6 py-2 font-bold',
                cancelButton: 'rounded-full px-6 py-2 font-bold'
            }
        });

        if (result.isConfirmed) {
            setIsTaking(true);
            toast.loading("Memproses...", { id: "take-req" });
            try {
                await takeRequest(requestId, user.uid);
                toast.success("Berhasil! Silakan buat materinya.", { id: "take-req" });
                router.push("/requests");
            } catch (error) {
                toast.error("Terjadi kesalahan, coba lagi nanti.", { id: "take-req" });
                console.log(error)
            } finally {
                setIsTaking(false);
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

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans pb-24">
            <Toaster position="top-center" />

            <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-sky-100/40 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/requests" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer">
                        <ChevronLeft className="w-5 h-5" /> Kembali ke Papan Request
                    </Link>
                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-full hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                    >
                        <Share2 className="w-4 h-4" /> Bagikan
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="p-8 sm:p-12">
                        <div className="mb-8">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-full mb-6">
                                <CheckCircle2 className="w-4 h-4" /> Status: Terbuka
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                                {request.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-600 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">Peminta Materi</span>
                                        <span className="text-slate-900 text-base">{request.requesterName}</span>
                                    </div>
                                </div>

                                {request.deadline && (
                                    <>
                                        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400">Tenggat Waktu</span>
                                                <span className="text-slate-900 text-base">{formatDate(request.deadline)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mb-12">
                            <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                Detail Kebutuhan
                            </h4>
                            <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-100">
                                {request.description}
                            </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-left md:text-left">
                                <p className="text-sm font-bold text-indigo-600 mb-2 flex items-center justify-start md:justify-start gap-2">
                                    <Wallet className="w-5 h-5" /> Reward Ditawarkan
                                </p>
                                <p className="text-4xl font-extrabold text-slate-900">{formatPrice(request.reward)}</p>
                                <p className="text-xs text-slate-500 mt-2 font-medium max-w-[200px] md:max-w-none">
                                    Dana ini akan diteruskan ke akunmu jika materi disetujui.
                                </p>
                            </div>

                            <div className="w-full md:w-auto flex-shrink-0">
                                {user ? (
                                    user.uid !== request.requesterId ? (
                                        <button
                                            onClick={handleTakeRequest}
                                            disabled={isTaking}
                                            className="w-full md:w-64 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer"
                                        >
                                            {isTaking ? "Memproses..." : "Ambil Request"} <ArrowRight className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <div className="w-full md:w-64 px-6 py-4 bg-slate-200 text-slate-500 font-extrabold text-base rounded-2xl flex items-center justify-center text-center">
                                            Ini Request Milikmu
                                        </div>
                                    )
                                ) : (
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="w-full md:w-64 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-3"
                                    >
                                        Masuk <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}