"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut, LayoutDashboard, FileText, ShoppingBag, PlusCircle, Video, Menu, X, Shield } from "lucide-react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { checkIsAdmin } from "../utils/auth";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setIsAdmin(false);
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const isMenuMobileActive = (path: string) => {
    return pathname === path 
      ? "bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600" 
      : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent";
  };

  const isMenuDesktopActive = (path: string) => {
    return pathname === path 
      ? "bg-indigo-50 text-indigo-700 font-bold" 
      : "text-slate-700 hover:bg-slate-50";
  };

  const isNavMainActive = (path: string) => {
    return pathname === path
      ? "text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1"
      : "text-slate-600 hover:text-indigo-600 font-medium pb-1 border-b-2 border-transparent";
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-indigo-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight cursor-pointer">
              TukarIlmu.
            </Link>
            
            {/* {pathname === '/explore' && ( */}
              <form onSubmit={handleSearch} className="hidden md:flex relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari materi kuliah..."
                  className="w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-slate-400" />
              </form>
            {/* )} */}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/explore" className={`${isNavMainActive("/explore")} transition-colors cursor-pointer`}>
              Explore
            </Link>
            <Link href="/requests" className={`${isNavMainActive("/requests")} transition-colors cursor-pointer`}>
              Requests
            </Link>

            {user ? (
              <div className="flex items-center gap-4 ml-4">
                <Link href="/upload" className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors cursor-pointer">
                  <Video className="w-4 h-4" />
                  Upload
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 pr-3 rounded-full hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                      >
                        <div className="p-2">
                          {isAdmin && (
                            <Link href="/admin" className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors mb-1 cursor-pointer ${pathname.startsWith("/admin") ? "bg-indigo-100 text-indigo-800 font-bold" : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold"}`}>
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors cursor-pointer ${isMenuDesktopActive("/dashboard")}`}>
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link href="/my-posts" className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors cursor-pointer ${isMenuDesktopActive("/my-posts")}`}>
                            <FileText className="w-4 h-4" /> My Posts
                          </Link>
                          <Link href="/my-purchases" className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors cursor-pointer ${isMenuDesktopActive("/my-purchases")}`}>
                            <ShoppingBag className="w-4 h-4" /> My Purchases
                          </Link>
                          <Link href="/create-request" className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors cursor-pointer ${isMenuDesktopActive("/create-request")}`}>
                            <PlusCircle className="w-4 h-4" /> Create Request
                          </Link>
                          <div className="h-px bg-slate-100 my-2"></div>
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full text-left transition-colors cursor-pointer">
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link href="/login" className="px-5 py-2.5 text-indigo-600 font-medium hover:bg-indigo-50 rounded-full transition-colors cursor-pointer">
                  Login
                </Link>
                <Link href="/register" className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-4">
              
              {pathname === '/explore' && (
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari materi kuliah..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                  <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-slate-400" />
                </form>
              )}
              
              <div className="flex flex-col space-y-2">
                <Link href="/explore" className={`px-4 py-2.5 font-medium rounded-xl transition-colors cursor-pointer ${pathname === "/explore" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMobileMenuOpen(false)}>
                  Explore
                </Link>
                <Link href="/requests" className={`px-4 py-2.5 font-medium rounded-xl transition-colors cursor-pointer ${pathname === "/requests" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMobileMenuOpen(false)}>
                  Requests
                </Link>
              </div>

              {user ? (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 px-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-1">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    {isAdmin && (
                      <Link href="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${pathname.startsWith("/admin") ? "bg-indigo-100 text-indigo-800 font-bold border-l-4 border-indigo-600" : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold border-l-4 border-transparent"}`} onClick={() => setMobileMenuOpen(false)}>
                        <Shield className="w-5 h-5" /> Admin Panel
                      </Link>
                    )}
                    <Link href="/upload" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${isMenuMobileActive("/upload")}`} onClick={() => setMobileMenuOpen(false)}>
                      <Video className="w-5 h-5" /> Upload
                    </Link>
                    <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${isMenuMobileActive("/dashboard")}`} onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/my-posts" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${isMenuMobileActive("/my-posts")}`} onClick={() => setMobileMenuOpen(false)}>
                      <FileText className="w-5 h-5" /> My Posts
                    </Link>
                    <Link href="/my-purchases" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${isMenuMobileActive("/my-purchases")}`} onClick={() => setMobileMenuOpen(false)}>
                      <ShoppingBag className="w-5 h-5" /> My Purchases
                    </Link>
                    <Link href="/create-request" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${isMenuMobileActive("/create-request")}`} onClick={() => setMobileMenuOpen(false)}>
                      <PlusCircle className="w-5 h-5" /> Create Request
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl w-full text-left transition-colors cursor-pointer border-l-4 border-transparent">
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                  <Link href="/login" className="w-full text-center px-5 py-3 text-indigo-600 font-medium bg-indigo-50 rounded-xl transition-colors cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/register" className="w-full text-center px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}