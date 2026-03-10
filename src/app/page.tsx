"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle, ArrowRight, BookOpen, Clock, Tag, FileText } from "lucide-react";
import katex from "katex";
import { getPopularVideos, getFreeVideos } from "../utils/videos";
import { getPopularPosts, getFreePosts } from "../utils/posts";
import { getPreviewRequests } from "../utils/requests";
import { Video } from "../types/video";
import { Post } from "../types/post";

const BACKGROUND_FORMULAS = [
  { formula: "\\int_{a}^{b} x^2 dx", top: "15%", left: "8%", duration: 3, delay: 0.5 },
  { formula: "E = mc^2", top: "25%", left: "75%", duration: 2, delay: 1.2 },
  { formula: "\\lim_{x \\to \\infty} \\frac{1}{x} = 0", top: "65%", left: "12%", duration: 4, delay: 0.2 },
  { formula: "\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}", top: "75%", left: "82%", duration: 3.5, delay: 1.5 },
  { formula: "f(x) = a_0 + \\sum_{n=1}^{\\infty} (a_n \\cos \\frac{n\\pi x}{L})", top: "40%", left: "85%", duration: 5, delay: 0.8 },
  { formula: "e^{i\\pi} + 1 = 0", top: "85%", left: "45%", duration: 2.5, delay: 2.0 },
  { formula: "\\frac{df}{dt} = \\lim_{h \\to 0} \\frac{f(t+h) - f(t)}{h}", top: "20%", left: "45%", duration: 4.5, delay: 0.3 },
  { formula: "\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^N (x_i - \\mu)^2}", top: "45%", left: "5%", duration: 4, delay: 1.8 }
];

export default function Home() {
  const [popularMaterials, setPopularMaterials] = useState<((Video | Post) & { id: string })[]>([]);
  const [freeMaterials, setFreeMaterials] = useState<((Video | Post) & { id: string })[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [popVids, popPosts, freeVids, freePosts, reqs] = await Promise.all([
        getPopularVideos(),
        getPopularPosts(),
        getFreeVideos(),
        getFreePosts(),
        getPreviewRequests()
      ]);

      const mergedPopular = [...popVids, ...popPosts]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 6);
        
      const mergedFree = [...freeVids, ...freePosts]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 6);

      setPopularMaterials(mergedPopular);
      setFreeMaterials(mergedFree);
      setRequests(reqs);
    };
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return price === 0 ? "Gratis" : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  return (
    <div className="w-full">
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute top-[-15%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[45rem] h-[45rem] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[15%] w-[35rem] h-[35rem] bg-fuchsia-50/60 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {BACKGROUND_FORMULAS.map((item, idx) => (
            <motion.div
              key={idx}
              className="absolute text-3xl md:text-5xl text-slate-900/10 font-bold whitespace-nowrap"
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

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-sm border border-indigo-100">
              Belajar dari yang Paling Relatable 💡
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
              Pahami Materi Kuliah <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Lebih Cepat & Mudah</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Platform peer-to-peer learning pertama untuk mahasiswa. Tonton video penjelasan dari mahasiswa lain, request materi yang belum kamu pahami, dan mulai berbagi ilmumu sendiri.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/explore" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-300 flex items-center justify-center gap-2 cursor-pointer">
                Explore Materi <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Materi Terpopuler 🔥</h2>
              <p className="text-slate-500">Penjelasan materi yang paling banyak membantu mahasiswa lain.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularMaterials.length > 0 ? popularMaterials.map((item) => {
              const isVideo = 'videoUrl' in item;
              return (
                <motion.div whileHover={{ y: -5 }} key={item.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className={`w-full h-48 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden ${isVideo ? 'bg-slate-50' : 'bg-fuchsia-50/50'}`}>
                    {item.thumbnailUrl ? (
                      <>
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/40 transition-colors z-0"></div>
                        {isVideo ? (
                          <PlayCircle className="w-12 h-12 text-white/90 group-hover:text-white transition-colors z-10 drop-shadow-md" />
                        ) : (
                          <FileText className="w-12 h-12 text-white/90 group-hover:text-white transition-colors z-10 drop-shadow-md" />
                        )}
                      </>
                    ) : (
                      <>
                        {isVideo ? (
                          <PlayCircle className="w-12 h-12 text-slate-300 group-hover:text-indigo-500 transition-colors z-10" />
                        ) : (
                          <FileText className="w-12 h-12 text-fuchsia-200 group-hover:text-fuchsia-500 transition-colors z-10" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent"></div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">{item.course}</span>
                    <span className="text-sm font-extrabold text-slate-700">{formatPrice(item.price)}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-5 line-clamp-2">{item.description}</p>
                  <Link href={isVideo ? `/video/${item.id}` : `/post/${item.id}`} className="w-full py-3 bg-slate-50 text-indigo-600 font-semibold rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors cursor-pointer">
                    {isVideo ? "View Video" : "Read Post"}
                  </Link>
                </motion.div>
              );
            }) : (
              <p className="text-slate-400 col-span-full text-center py-10">Belum ada materi populer.</p>
            )}
          </div>
        </section>

        <section className="bg-gradient-to-br from-indigo-50/80 via-violet-50/50 to-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-20 rounded-[3rem] border border-white/60 shadow-sm">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Request Materi 📝</h2>
              <p className="text-slate-600">Bantu jawab request ini dan jadikan ladang cuan atau amal.</p>
            </div>
            <Link href="/explore" className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 cursor-pointer">
              View All Requests <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {requests.length > 0 ? requests.map((req) => (
              <div key={req.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 mb-3">
                  <Tag className="w-3 h-3" /> {req.course}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{req.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4">{req.description}</p>
                <div className="flex items-center text-xs text-slate-400 gap-1 mt-auto">
                  <Clock className="w-3 h-3" /> Dibutuhkan segera
                </div>
              </div>
            )) : (
              <p className="text-slate-400 col-span-full text-center py-10">Belum ada request materi.</p>
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/explore" className="inline-flex items-center gap-2 text-indigo-600 font-semibold cursor-pointer">
              View All Requests <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Informasi Umum Gratis 🎁</h2>
              <p className="text-slate-500">Materi dasar yang bisa kamu pelajari tanpa biaya.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {freeMaterials.length > 0 ? freeMaterials.map((item) => {
              const isVideo = 'videoUrl' in item;
              return (
                <motion.div whileHover={{ y: -5 }} key={item.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className={`w-full h-40 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden ${isVideo ? 'bg-indigo-50/50' : 'bg-fuchsia-50/50'}`}>
                    {item.thumbnailUrl ? (
                      <>
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/40 transition-colors z-0"></div>
                        {isVideo ? (
                          <BookOpen className="w-10 h-10 text-white/90 group-hover:text-white transition-colors z-10 drop-shadow-md" />
                        ) : (
                          <FileText className="w-10 h-10 text-white/90 group-hover:text-white transition-colors z-10 drop-shadow-md" />
                        )}
                      </>
                    ) : (
                      <>
                        {isVideo ? (
                          <BookOpen className="w-10 h-10 text-indigo-200 group-hover:text-indigo-400 transition-colors z-10" />
                        ) : (
                          <FileText className="w-10 h-10 text-fuchsia-200 group-hover:text-fuchsia-400 transition-colors z-10" />
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-600 rounded-lg mb-3 inline-block">Gratis</span>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-5 line-clamp-2">{item.description}</p>
                  <Link href={isVideo ? `/video/${item.id}` : `/post/${item.id}`} className="w-full py-3 bg-slate-50 text-indigo-600 font-semibold rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors cursor-pointer">
                    {isVideo ? "View Video" : "Read Post"}
                  </Link>
                </motion.div>
              );
            }) : (
              <p className="text-slate-400 col-span-full text-center py-10">Belum ada materi gratis.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}