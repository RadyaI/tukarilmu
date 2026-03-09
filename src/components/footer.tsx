import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6" />
              TukarIlmu
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              Platform peer-to-peer learning untuk mahasiswa. Belajar dari penjelasan yang lebih relatable, temukan materi spesifik, dan berbagi ilmu dengan sesama mahasiswa.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Menu Utama</h3>
            <ul className="space-y-3">
              <li><Link href="/explore" className="text-slate-500 hover:text-indigo-600 transition-colors">Explore</Link></li>
              <li><Link href="/requests" className="text-slate-500 hover:text-indigo-600 transition-colors">Requests</Link></li>
              <li><Link href="/login" className="text-slate-500 hover:text-indigo-600 transition-colors">Login</Link></li>
              <li><Link href="/register" className="text-slate-500 hover:text-indigo-600 transition-colors">Register</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Perusahaan</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-slate-500 hover:text-indigo-600 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-slate-500 hover:text-indigo-600 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-slate-500 hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} TukarIlmu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}