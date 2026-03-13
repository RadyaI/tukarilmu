"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Briefcase,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    Check,
    UploadCloud,
    Filter,
    ArrowDownUp,
    Inbox
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    getMyCreatedRequests,
    getMyTakenRequests,
    approveRequest,
    addRequestComment
} from "../../utils/requests";

export default function MyRequestsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [createdRequests, setCreatedRequests] = useState<any[]>([]);
    const [takenRequests, setTakenRequests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"created" | "taken">("created");
    
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
                loadAllData(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const loadAllData = async (uid: string) => {
        setLoading(true);
        const [created, taken] = await Promise.all([
            getMyCreatedRequests(uid),
            getMyTakenRequests(uid)
        ]);
        setCreatedRequests(created);
        setTakenRequests(taken);
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
    };

    const formatDate = (dateObj: any) => {
        if (!dateObj) return "-";
        const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { bg: string, text: string, label: string }> = {
            open: { bg: "bg-sky-50", text: "text-sky-600", label: "Terbuka" },
            taken: { bg: "bg-amber-50", text: "text-amber-600", label: "Dikerjakan" },
            submitted: { bg: "bg-indigo-50", text: "text-indigo-600", label: "Menunggu Review" },
            done: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Selesai" },
            canceled: { bg: "bg-rose-50", text: "text-rose-600", label: "Dibatalkan" }
        };
        const config = variants[status] || variants.open;
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const handleApprove = async (id: string) => {
        const result = await Swal.fire({
            title: 'Setujui Materi?',
            text: "Dengan menyetujui, reward akan diteruskan ke kreator.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Setujui',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-[2rem]',
                confirmButton: 'rounded-full px-6 py-2 font-bold',
                cancelButton: 'rounded-full px-6 py-2 font-bold'
            }
        });

        if (result.isConfirmed) {
            toast.loading("Memproses persetujuan...", { id: "approve" });
            try {
                await approveRequest(id);
                toast.success("Request berhasil diselesaikan!", { id: "approve" });
                loadAllData(user.uid);
            } catch (error) {
                toast.error("Gagal memproses. Coba lagi.", { id: "approve" });
            }
        }
    };

    const handleComment = async (id: string, currentMessage?: string) => {
        const result = await Swal.fire({
            title: 'Berikan Komentar / Revisi',
            input: 'textarea',
            inputValue: currentMessage || "",
            inputPlaceholder: 'Tulis pesan untuk kreator di sini...',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Kirim',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-[2rem]',
                input: 'rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500',
                confirmButton: 'rounded-full px-6 py-2 font-bold',
                cancelButton: 'rounded-full px-6 py-2 font-bold'
            }
        });

        if (result.isConfirmed && result.value) {
            toast.loading("Mengirim pesan...", { id: "comment" });
            try {
                await addRequestComment(id, result.value);
                toast.success("Pesan terkirim!", { id: "comment" });
                loadAllData(user.uid);
            } catch (error) {
                toast.error("Gagal mengirim pesan.", { id: "comment" });
            }
        }
    };

    const getProcessedData = (data: any[]) => {
        let filtered = data;
        if (statusFilter !== "all") {
            filtered = filtered.filter(item => item.status === statusFilter);
        }
        
        return filtered.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
        });
    };

    const displayData = activeTab === "created" ? getProcessedData(createdRequests) : getProcessedData(takenRequests);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24 relative overflow-hidden">
            <Toaster position="top-center" />
            
            <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Aktivitas Request</h1>
                    <p className="text-lg text-slate-500 max-w-2xl">Pantau request yang kamu buat dan progress materi yang sedang kamu kerjakan untuk mahasiswa lain.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 mb-1">Total Request Dibuat</p>
                            <p className="text-4xl font-extrabold text-slate-900">{createdRequests.length}</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <Briefcase className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 mb-1">Request Dikerjakan</p>
                            <p className="text-4xl font-extrabold text-slate-900">{takenRequests.length}</p>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-slate-100 gap-6">
                        <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab("created")}
                                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "created" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Request Saya
                            </button>
                            <button
                                onClick={() => setActiveTab("taken")}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "taken" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Tugas Diambil
                            </button>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Filter className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="open">Terbuka</option>
                                    <option value="taken">Dikerjakan</option>
                                    <option value="submitted">Menunggu Review</option>
                                    <option value="done">Selesai</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={sortOrder === "newest" ? "Urutkan Terlama" : "Urutkan Terbaru"}
                            >
                                <ArrowDownUp className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8 overflow-x-auto">
                        <AnimatePresence mode="wait">
                            {displayData.length > 0 ? (
                                <motion.div
                                    key={activeTab + statusFilter + sortOrder}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="min-w-[800px]"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="pb-6 px-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Info Request</th>
                                                <th className="pb-6 px-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Reward</th>
                                                <th className="pb-6 px-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="pb-6 px-4 text-sm font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {displayData.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-6 px-4">
                                                        <p className="font-extrabold text-slate-900 mb-1 max-w-md truncate">{item.title}</p>
                                                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(item.createdAt)}</span>
                                                            {item.deadline && <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Tenggat: {formatDate(item.deadline)}</span>}
                                                        </div>
                                                        {item.message && (
                                                            <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                                                <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5 mb-1"><MessageSquare className="w-3.5 h-3.5" /> Pesan Terakhir:</p>
                                                                <p className="text-sm text-slate-700 italic">"{item.message}"</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <span className="font-extrabold text-slate-900">{formatPrice(item.reward)}</span>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        {getStatusBadge(item.status)}
                                                    </td>
                                                    <td className="py-6 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-5">
                                                            <button 
                                                                onClick={() => router.push(`/${item.type}/${item.materialId}`)}
                                                                className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer"
                                                                title="Lihat Detail"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {activeTab === "created" && item.status === "submitted" && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleComment(item.id, item.message)}
                                                                        className="p-2.5 text-amber-500 hover:text-white bg-white hover:bg-amber-500 border border-slate-200 hover:border-amber-500 rounded-xl transition-all cursor-pointer"
                                                                        title="Beri Komentar / Revisi"
                                                                    >
                                                                        <MessageSquare className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleApprove(item.id)}
                                                                        className="p-2.5 text-emerald-500 hover:text-white bg-white hover:bg-emerald-500 border border-slate-200 hover:border-emerald-500 rounded-xl transition-all cursor-pointer"
                                                                        title="Setujui Materi"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {activeTab === "taken" && item.status === "taken" && (
                                                                <button 
                                                                    onClick={() => router.push(`/upload?request=${item.id}`)}
                                                                    className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    <UploadCloud className="w-4 h-4" /> Submit
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="py-24 text-center flex flex-col items-center justify-center"
                                >
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Inbox className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak ada data ditemukan</h3>
                                    <p className="text-slate-500 font-medium">Belum ada request yang sesuai dengan filter yang kamu pilih.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}