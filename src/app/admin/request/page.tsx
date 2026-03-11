"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Film, 
  FileText, 
  CreditCard, 
  HelpCircle, 
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Search,
  Eye,
  Trash2,
  Edit3,
  Calendar,
  X,
  Target,
  User,
  Clock
} from "lucide-react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { getAllRequestsForAdmin, deleteRequestAdmin, updateRequestStatus } from "../../../utils/requests";
import { RequestStatus } from "../../../types/request";

export default function AdminManageRequests() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          fetchRequests();
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getAllRequestsForAdmin();
    setRequests(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Request?',
      text: "Data permintaan materi ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (result.isConfirmed) {
      toast.loading("Menghapus request...", { id: "delete" });
      try {
        await deleteRequestAdmin(id);
        setRequests(requests.filter(r => r.id !== id));
        if (selectedRequest?.id === id) setSelectedRequest(null);
        toast.success("Request berhasil dihapus!", { id: "delete" });
      } catch (error: any) {
        toast.error(error.message, { id: "delete" });
      }
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const statuses = { open: "Open", taken: "Taken", done: "Done", failed: "Failed" };
    
    const { value: newStatus } = await Swal.fire({
      title: 'Update Status Request',
      input: 'select',
      inputOptions: statuses,
      inputValue: currentStatus,
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold', input: 'rounded-xl p-3 bg-slate-50 border-slate-200 outline-none' }
    });

    if (newStatus && newStatus !== currentStatus) {
      toast.loading("Memperbarui status...", { id: "status" });
      try {
        await updateRequestStatus(id, newStatus as RequestStatus);
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (selectedRequest?.id === id) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
        toast.success("Status berhasil diperbarui!", { id: "status" });
      } catch (error: any) {
        toast.error(error.message, { id: "status" });
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-";
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'open': return 'bg-emerald-50 text-emerald-600';
      case 'taken': return 'bg-indigo-50 text-indigo-600';
      case 'done': return 'bg-violet-50 text-violet-600';
      case 'failed': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const filteredRequests = requests.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <Toaster position="top-center" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-amber-100/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-orange-100/40 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col z-20 relative shrink-0">
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold text-amber-600">
            <ShieldCheck className="w-8 h-8" />
          </Link>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Admin Workspace</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-amber-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/user" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-amber-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Users className="w-5 h-5" /> Manage Users
          </Link>
          <Link href="/admin/video" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-amber-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Film className="w-5 h-5" /> Manage Videos
          </Link>
          <Link href="/admin/post" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-amber-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <FileText className="w-5 h-5" /> Manage Posts
          </Link>
          <Link href="/admin/transaksi" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-amber-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <CreditCard className="w-5 h-5" /> Transaksi
          </Link>
          <Link href="/admin/request" className="flex items-center gap-3 px-4 py-3.5 bg-amber-50 text-amber-700 font-bold rounded-2xl transition-colors cursor-pointer">
            <HelpCircle className="w-5 h-5" /> Requests
          </Link>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 font-bold rounded-2xl transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 z-10 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Permintaan Materi (Requests)</h1>
            <p className="text-slate-500">Kelola dan pantau request materi yang dibuat oleh mahasiswa.</p>
          </div>
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Cari judul, pembuat, status..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium text-slate-800"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Judul & Pembuat</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Imbalan</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length > 0 ? filteredRequests.map((r, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={r.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5 max-w-sm">
                      <p className="font-bold text-slate-900 truncate mb-1" title={r.title}>{r.title}</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <User className="w-3.5 h-3.5" /> {r.requesterName}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-extrabold text-slate-800">
                        {formatPrice(r.reward)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => setSelectedRequest(r)}
                          title="Lihat Detail"
                          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(r.id, r.status)}
                          title="Ubah Status"
                          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          title="Hapus Request"
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Tidak ada request yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setSelectedRequest(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100"
            >
              <button 
                onClick={() => setSelectedRequest(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 pr-12">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusStyle(selectedRequest.status)}`}>
                    Status: {selectedRequest.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> Dibuat: {formatDate(selectedRequest.createdAt)}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">{selectedRequest.title}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Imbalan (Reward)</p>
                  <p className="text-xl font-extrabold text-slate-800">{formatPrice(selectedRequest.reward)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Tenggat Waktu (Deadline)</p>
                  <p className="text-lg font-bold text-slate-800">{formatDate(selectedRequest.deadline)}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm font-bold text-slate-500 mb-3">Deskripsi Kebutuhan</p>
                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {selectedRequest.description || "Tidak ada deskripsi spesifik."}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Pembuat Request</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {selectedRequest.requesterName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedRequest.requesterName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {selectedRequest.requesterId?.substring(0,8)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Diambil Oleh</p>
                  {selectedRequest.takerId ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {selectedRequest.takerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedRequest.takerName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {selectedRequest.takerId?.substring(0,8)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 h-10">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg italic">Belum ada yang mengambil</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.materialId && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 mb-2">Material ID Tautan</p>
                  <p className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl inline-block">{selectedRequest.materialId}</p>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}