"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Film, 
  FileText, 
  CreditCard, 
  HelpCircle, 
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Trash2,
  Ban,
  Shield,
  Tag,
  UserCheck,
  Search
} from "lucide-react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { getAllUsers, updateUserRole, updateUserTag, toggleBanUser, deleteUserDoc } from "../../../utils/users";

export default function AdminManageUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          fetchUsers();
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "mahasiswa" : "admin";
    const result = await Swal.fire({
      title: 'Ubah Hak Akses?',
      text: `Yakin ingin mengubah user ini menjadi ${newRole.toUpperCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Ubah!',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (result.isConfirmed) {
      toast.loading("Memperbarui role...", { id: "role" });
      try {
        await updateUserRole(userId, newRole as any);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast.success("Role berhasil diperbarui!", { id: "role" });
      } catch (error: any) {
        toast.error(error.message, { id: "role" });
      }
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "membuka blokir" : "memblokir";
    const result = await Swal.fire({
      title: 'Konfirmasi Tindakan',
      text: `Yakin ingin ${actionText} user ini?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#10b981' : '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `Ya, ${actionText}!`,
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (result.isConfirmed) {
      toast.loading("Memproses...", { id: "ban" });
      try {
        await toggleBanUser(userId, !currentStatus);
        setUsers(users.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
        toast.success(`User berhasil di${actionText}!`, { id: "ban" });
      } catch (error: any) {
        toast.error(error.message, { id: "ban" });
      }
    }
  };

  const handleUpdateTag = async (userId: string, currentTag: string) => {
    const tags = ["Mahasiswa", "Admin", "Si Ambis", "Verified Mentor", "Mahasiswa Aktif"];
    const inputOptions: any = {};
    tags.forEach(t => inputOptions[t] = t);

    const { value: newTag } = await Swal.fire({
      title: 'Pilih Tag Baru',
      input: 'select',
      inputOptions,
      inputValue: currentTag || "Mahasiswa",
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold', input: 'rounded-xl p-3 bg-slate-50 border-slate-200' }
    });

    if (newTag && newTag !== currentTag) {
      toast.loading("Memperbarui tag...", { id: "tag" });
      try {
        await updateUserTag(userId, newTag as any);
        setUsers(users.map(u => u.id === userId ? { ...u, tag: newTag } : u));
        toast.success("Tag berhasil diperbarui!", { id: "tag" });
      } catch (error: any) {
        toast.error(error.message, { id: "tag" });
      }
    }
  };

  const handleDelete = async (userId: string) => {
    const result = await Swal.fire({
      title: 'Hapus User Permanen?',
      text: "Data ini akan dihapus dari database. Aksi ini tidak dapat dibatalkan!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Hapus Permanen',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (result.isConfirmed) {
      toast.loading("Menghapus data user...", { id: "delete" });
      try {
        await deleteUserDoc(userId);
        setUsers(users.filter(u => u.id !== userId));
        toast.success("Data user berhasil dihapus!", { id: "delete" });
      } catch (error: any) {
        toast.error(error.message, { id: "delete" });
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <Toaster position="top-center" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/60 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-fuchsia-100/60 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col z-20 relative shrink-0">
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold text-indigo-600">
            <ShieldCheck className="w-8 h-8" />
          </Link>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Admin Workspace</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/user" className="flex items-center gap-3 px-4 py-3.5 bg-indigo-50 text-indigo-700 font-bold rounded-2xl transition-colors cursor-pointer">
            <Users className="w-5 h-5" /> Manage Users
          </Link>
          <Link href="/admin/video" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <Film className="w-5 h-5" /> Manage Videos
          </Link>
          <Link href="/admin/post" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <FileText className="w-5 h-5" /> Manage Posts
          </Link>
          <Link href="/admin/transaksi" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
            <CreditCard className="w-5 h-5" /> Transaksi
          </Link>
          <Link href="/admin/request" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-semibold rounded-2xl transition-colors cursor-pointer">
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
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Manajemen Pengguna</h1>
            <p className="text-slate-500">Atur akses, tag, blokir, dan kelola semua akun yang terdaftar.</p>
          </div>
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-800"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Pengguna</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Akses & Status</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Tag Profil</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? filteredUsers.map((u, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={u.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatar ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" /> : u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name || "Tanpa Nama"}</p>
                          <p className="text-sm text-slate-500">{u.email}</p>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">{u.provider === 'google' ? 'Google Auth' : 'Email/Password'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {u.role === 'admin' ? 'Administrator' : 'Mahasiswa'}
                        </span>
                        {u.banned && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 flex items-center gap-1.5">
                            <Ban className="w-3 h-3" /> Diblokir
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 font-bold text-xs rounded-lg inline-flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> {u.tag || "Mahasiswa"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => handleUpdateTag(u.id, u.tag)}
                          title="Ganti Tag"
                          className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleRole(u.id, u.role)}
                          title={u.role === 'admin' ? "Jadikan Mahasiswa" : "Jadikan Admin"}
                          className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          {u.role === 'admin' ? <UserCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleToggleBan(u.id, !!u.banned)}
                          title={u.banned ? "Buka Blokir" : "Blokir User"}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${u.banned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'}`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          title="Hapus Permanen"
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
                      Tidak ada pengguna yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}