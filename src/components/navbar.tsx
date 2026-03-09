"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronDown, User, LogOut, LayoutDashboard, FileText, ShoppingBag, PlusCircle, Video } from "lucide-react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-indigo-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight">
              TukarIlmu.
            </Link>
            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Cari materi kuliah..."
                className="w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Explore
            </Link>
            <Link href="/requests" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Requests
            </Link>

            {user ? (
              <div className="flex items-center gap-4 ml-4">
                <Link href="/upload" className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors">
                  <Video className="w-4 h-4" />
                  Upload Video
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 pr-3 rounded-full hover:border-indigo-300 transition-all"
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
                          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link href="/my-posts" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                            <FileText className="w-4 h-4" /> My Posts
                          </Link>
                          <Link href="/my-purchases" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                            <ShoppingBag className="w-4 h-4" /> My Purchases
                          </Link>
                          <Link href="/create-request" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                            <PlusCircle className="w-4 h-4" /> Create Request
                          </Link>
                          <div className="h-px bg-slate-100 my-2"></div>
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full text-left transition-colors">
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
                <Link href="/login" className="px-5 py-2.5 text-indigo-600 font-medium hover:bg-indigo-50 rounded-full transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}