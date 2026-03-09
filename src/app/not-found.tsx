"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Compass, AlertTriangle } from "lucide-react";
import katex from "katex";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";
import "animate.css";

const ERROR_FORMULAS = [
    { formula: "404 \\neq 200", top: "15%", left: "10%", duration: 3, delay: 0.5 },
    { formula: "\\lim_{x \\to 404} f(x) = \\emptyset", top: "25%", left: "75%", duration: 4, delay: 1.2 },
    { formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 404ac}}{2a}", top: "75%", left: "15%", duration: 3.5, delay: 0.8 },
    { formula: "\\sum_{i=1}^{\\infty} \\text{Error} = 404", top: "65%", left: "80%", duration: 5, delay: 0.2 },
];

export default function NotFound() {
    const handleReportLink = () => {
        toast.success("Mencatat log error...", {
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });

        setTimeout(() => {
            Swal.fire({
                title: 'Laporan Diterima! 🚀',
                text: 'Makasih ya udah lapor! Admin kita yang lagi pusing revisian skripsi bakal segera benerin link ini.',
                icon: 'success',
                confirmButtonColor: '#4f46e5',
                confirmButtonText: 'Sama-sama!',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-full px-6 py-2 font-bold'
                }
            });
        }, 1000);
    };

    return (
        <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
            <Toaster position="top-center" reverseOrder={false} />

            <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-50/60 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-violet-50/60 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {ERROR_FORMULAS.map((item, idx) => (
                    <motion.div
                        key={idx}
                        className="absolute text-2xl md:text-4xl text-slate-900/10 font-bold whitespace-nowrap"
                        style={{ top: item.top, left: item.left }}
                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: "inset(0 0% 0 0)" }}
                        transition={{
                            duration: item.duration,
                            delay: item.delay,
                            ease: "linear",
                            repeat: Infinity,
                            repeatType: "reverse",
                            repeatDelay: 3
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: katex.renderToString(item.formula, { throwOnError: false }) }} />
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                >
                    <div className="animate__animated animate__pulse animate__infinite animate__slower inline-block mb-2">
                        <h1 className="text-[8rem] md:text-[12rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-indigo-400 to-violet-500 leading-none drop-shadow-sm">
                            404
                        </h1>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
                        Waduh, halamannya bolos kelas!
                    </h2>

                    <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-md mx-auto">
                        Kayaknya URL yang kamu masukin salah ketik, atau emang materinya udah dihapus sama yang upload.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2 group"
                        >
                            <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                            Kembali ke Beranda
                        </Link>

                        <Link
                            href="/explore"
                            className="w-full sm:w-auto px-8 py-3.5 bg-slate-50 text-indigo-600 font-semibold rounded-full hover:bg-slate-100 transition-all border border-slate-200 flex items-center justify-center gap-2 group"
                        >
                            <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                            Explore Materi
                        </Link>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <button
                            onClick={handleReportLink}
                            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Laporin link rusak ke Admin
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}