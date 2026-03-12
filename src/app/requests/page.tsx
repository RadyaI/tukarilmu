"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PlusCircle, Clock, User, FileQuestion, CheckCircle2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getOpenRequests, takeRequest } from "../../utils/requests";

export default function RequestsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        loadRequests();
        return () => unsubscribe();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        const data = await getOpenRequests();
        setRequests(data);
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

    const filteredRequests = requests.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans pb-24">
            <Toaster position="top-center" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full mb-4">
                            <FileQuestion className="w-4 h-4" /> Request Board
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Butuh Materi Spesifik?</h1>
                        <p className="text-lg text-slate-600 max-w-2xl">Bantu temanmu memahami pelajaran dan dapatkan reward, atau buat request baru jika kamu butuh bantuan dari kreator lain.</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        {user ? (
                            <Link href="/requests/create" className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 cursor-pointer">
                                <PlusCircle className="w-5 h-5" /> Buat Request Baru
                            </Link>
                        ) : (
                            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all cursor-pointer">
                                Masuk untuk Request
                            </Link>
                        )}
                    </div>
                </div>

                <div className="relative w-full max-w-xl mb-12 flex items-center">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari materi kuliah..."
                        className="w-1/2 sm:w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all z-10"
                    />
                    <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-slate-400 z-20" />
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col cursor-pointer group"
                                onClick={() => router.push(`/requests/${req.id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Terbuka
                                    </span>
                                    <span className="text-lg font-extrabold text-slate-800 bg-slate-50 px-3 py-1 rounded-xl">
                                        {formatPrice(req.reward)}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{req.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">{req.description}</p>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="truncate max-w-[100px]">{req.requesterName}</span>
                                    </div>
                                    {req.deadline && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                                            <Clock className="w-3.5 h-3.5" /> {formatDate(req.deadline)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-20 px-4 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50 backdrop-blur-sm">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileQuestion className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada request terbuka</h3>
                                <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">Jadilah yang pertama meminta materi, atau tunggu teman lain memposting request mereka.</p>
                                {user && (
                                    <Link href="/requests/create" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer">
                                        Buat Request
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}