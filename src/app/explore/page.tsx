"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, FileText, Star,
  Tag, GraduationCap, X, ChevronDown, Sparkles, PlusCircle, Heart, Search
} from "lucide-react";
import katex from "katex";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../config/firebase";
import { JURUSAN_LIST, Jurusan } from "../../types/jurusan";
import { Video } from "../../types/video";
import { Post } from "../../types/post";

type Material = (Video | Post) & { id: string, type: "video" | "post" };

const BACKGROUND_FORMULAS = [
  { formula: "\\int_{a}^{b} x^2 dx = \\frac{b^3 - a^3}{3}", top: "4%", left: "6%", duration: 4, delay: 0 },
  { formula: "E = mc^2", top: "12%", left: "28%", duration: 3, delay: 1 },
  { formula: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}", top: "7%", left: "60%", duration: 3.5, delay: 0.5 },
  { formula: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", top: "22%", left: "72%", duration: 4.5, delay: 0.8 },
  { formula: "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}", top: "48%", left: "10%", duration: 5, delay: 1.5 },
  { formula: "e^{i\\pi} + 1 = 0", top: "52%", left: "60%", duration: 4, delay: 0.7 },
  { formula: "\\frac{d}{dx} e^x = e^x", top: "72%", left: "25%", duration: 3.8, delay: 1 }
];

const BACKGROUND_SCRIBBLES = [
  { src: "/images/coratcoret/1.png", top: "1%", left: "70%", width: "300px", rotate: "15deg", opacity: 0.4 },
  { src: "/images/coratcoret/2.png", top: "15%", left: "-5%", width: "450px", rotate: "-10deg", opacity: 0.4 },
  { src: "/images/coratcoret/3.png", top: "55%", left: "55%", width: "400px", rotate: "5deg", opacity: 0.4 }
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearchQuery = searchParams.get("search") || "";

  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);

  const [filters, setFilters] = useState({
    type: "all",
    jurusan: "" as Jurusan | "",
    price: "all",
    sort: "popular"
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [videosSnap, postsSnap] = await Promise.all([
          getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")))
        ]);

        const videos = videosSnap.docs.map(doc => ({ id: doc.id, type: "video" as const, ...doc.data() } as Material));
        const posts = postsSnap.docs.map(doc => ({ id: doc.id, type: "post" as const, ...doc.data() } as Material));

        const combined = [...videos, ...posts];
        setAllMaterials(combined);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    let result = [...allMaterials];

    if (urlSearchQuery.trim() !== "") {
      const q = urlSearchQuery.toLowerCase();
      result = result.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.course && m.course.toLowerCase().includes(q))
      );
    }

    if (filters.type === "video") {
      result = result.filter(m => m.type === "video");
    } else if (filters.type === "post") {
      result = result.filter(m => m.type === "post");
    }

    if (filters.jurusan !== "") {
      result = result.filter(m => m.jurusan === filters.jurusan);
    }

    if (filters.price === "free") {
      result = result.filter(m => m.price === 0);
    } else if (filters.price === "paid") {
      result = result.filter(m => m.price > 0);
    }

    if (filters.sort === "popular") {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (filters.sort === "newest") {
      result.sort((a, b) => {
        const getMillis = (dateObj: any) => {
          if (!dateObj) return 0;
          if (typeof dateObj.toMillis === 'function') return dateObj.toMillis();
          if (dateObj.seconds) return dateObj.seconds * 1000;
          return new Date(dateObj).getTime() || 0;
        };
        return getMillis(b.createdAt) - getMillis(a.createdAt);
      });
    }

    setFilteredMaterials(result);
    setVisibleCount(9);
  }, [filters, urlSearchQuery, allMaterials]);

  const handleResetFilters = () => {
    setFilters({ type: "all", jurusan: "", price: "all", sort: "popular" });
    if (urlSearchQuery) {
      router.push('/explore');
    }
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Gratis";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const hasActiveFilters = filters.type !== "all" || filters.jurusan !== "" || filters.price !== "all" || filters.sort !== "popular" || urlSearchQuery !== "";

  const isDefaultView = filters.sort === "popular" && urlSearchQuery === "" && filters.type === "all" && filters.jurusan === "" && filters.price === "all";
  const validFeatured = isDefaultView && filteredMaterials.length >= 3;

  const featuredMaterials = validFeatured ? filteredMaterials.slice(0, 3) : [];
  const gridMaterials = filteredMaterials.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMaterials.length;

  const renderCard = (item: Material) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      key={item.id}
      className="bg-white/90 backdrop-blur-sm rounded-[2rem] border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden"
    >
      <Link href={`/${item.type}/${item.id}`} className="flex flex-col h-full w-full">
        <div className="p-2 pb-0">
          <div className={`w-full h-48 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden ${item.type === 'video' ? 'bg-indigo-50' : 'bg-fuchsia-50'}`}>
            {item.thumbnailUrl ? (
              <>
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-colors z-0"></div>
                {item.type === 'video' ? <PlayCircle className="w-12 h-12 text-white/90 z-10 drop-shadow-md" /> : <FileText className="w-12 h-12 text-white/90 z-10 drop-shadow-md" />}
              </>
            ) : (
              item.type === 'video' ? <PlayCircle className="w-12 h-12 text-indigo-300 group-hover:text-indigo-500 transition-colors" /> : <FileText className="w-12 h-12 text-fuchsia-300 group-hover:text-fuchsia-500 transition-colors" />
            )}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm z-10">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> {item.likes || 0}
            </div>
            <div className="absolute bottom-3 left-3 flex gap-2 z-10">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-md ${item.type === 'video' ? 'bg-indigo-500/90 text-white' : 'bg-fuchsia-500/90 text-white'}`}>
                {item.type === 'video' ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />} {item.type === 'video' ? 'Video' : 'Artikel'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1 line-clamp-1 max-w-[60%]">
              <Tag className="w-3 h-3 shrink-0" /> {item.course}
            </span>
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-lg shrink-0 ${!item.price || item.price === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {formatPrice(item.price)}
            </span>
          </div>

          <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
          <p className="text-sm text-slate-500 mb-5 line-clamp-2">{item.description}</p>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 line-clamp-1">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" /> {item.jurusan}
            </span>
            <span className={`text-sm font-bold flex items-center gap-1 transition-colors px-4 py-2 rounded-xl shrink-0 ${item.type === 'video' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white'}`}>
              Buka <PlayCircle className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="w-full relative z-10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">

        <div className="mb-4 md:mb-12 text-left md:text-center">

          {/* DESKTOPP */}
          <div className="hidden md:block">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 md:text-center! w-1/2 md:w-full">
              Eksplorasi <span className="text-indigo-500">Materi Kuliah</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl md:text-center! md:mx-auto! w-60 md:w-full">
              Temukan video penjelasan dan ringkasan materi dari mahasiswa lain. <span className="hidden md:block">Belajar jadi lebih relate dan gampang masuk otak!</span>
            </p>
          </div>

          {/* MOBILE ONLY */}
          <div className="block md:hidden">
            <div className="flex items-center gap-4">
              <h1 className="leading-7 text-[24px] font-semibold text-slate-900 tracking-tight flex-1">
                Temukan video penjelasan dan ringkasan <br /> materi dari mahasiswa lain.
              </h1>
              <img
                src="/images/explore/booknobg.png"
                alt="Buku"
                className="w-35 h-35 mr-3 shrink-0 object-contain mix-blend-multiply"
              />
            </div>
          </div>

          {urlSearchQuery && (
            <div className="mt-6">
              <span className="font-bold text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-full border border-indigo-100 flex items-center justify-center gap-2 w-fit max-w-full break-all md:[margin-left:auto] md:[margin-right:auto]">
                <Search className="w-4 h-4 shrink-0" /> Hasil Pencarian: "{urlSearchQuery}"
              </span>
            </div>
          )}
        </div>

        <div className="md:bg-white/80 md:backdrop-blur-xl rounded-[2rem] md:p-6 pt-2 md:shadow-sm md:border md:border-slate-100 mb-12 sticky top-24 z-30">
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            <div className="relative shrink-0 w-[30vw] sm:w-[45vw] md:w-auto">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-slate-500 md:border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 font-medium appearance-none cursor-pointer"
              >
                <option value="all">Materi</option>
                <option value="video">Hanya Video</option>
                <option value="post">Hanya Artikel/Blog</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0 w-[35vw] sm:w-[45vw] md:w-auto">
              <select
                value={filters.jurusan}
                onChange={(e) => setFilters({ ...filters, jurusan: e.target.value as any })}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-slate-500 md:border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 font-medium appearance-none cursor-pointer"
              >
                <option value="">Jurusan</option>
                {JURUSAN_LIST.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0 w-[30vw] sm:w-[45vw] md:w-auto">
              <select
                value={filters.price}
                onChange={(e) => setFilters({ ...filters, price: e.target.value })}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-slate-500 md:border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 font-medium appearance-none cursor-pointer"
              >
                <option value="all">Harga</option>
                <option value="free">Hanya Gratis</option>
                <option value="paid">Premium</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0 w-[40vw] sm:w-[45vw] md:w-auto">
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-slate-500 md:border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 font-medium appearance-none cursor-pointer"
              >
                <option value="popular">Terpopuler</option>
                <option value="newest">Terbaru</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex justify-end pt-4 border-t border-slate-100 overflow-hidden"
              >
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" /> Reset Filter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-5 border border-slate-100 animate-pulse">
                <div className="w-full h-48 bg-slate-200 rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-6"></div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-sm">
            <div className="w-24 h-24 inline-flex items-center justify-center mb-6 bg-indigo-50 rounded-full">
              <FileText className="w-12 h-12 text-indigo-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Materi Tidak Ditemukan</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Sepertinya materi yang kamu cari belum ada yang bahas nih. Mau coba buat request biar dibuatin?</p>
            <Link href="/create-request" className="inline-flex px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 cursor-pointer items-center gap-2">
              <PlusCircle className="w-5 h-5" /> Buat Request Materi
            </Link>
          </motion.div>
        ) : (
          <>
            {validFeatured && (
              <div className="hidden md:block mb-16">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  <h2 className="text-2xl font-extrabold text-slate-900">Top of the Week 🔥</h2>
                </div>

                <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[480px]">
                  <Link href={`/${featuredMaterials[0].type}/${featuredMaterials[0].id}`} className="lg:col-span-2 group cursor-pointer block relative rounded-[2.5rem] overflow-hidden h-[300px] lg:h-full shadow-sm">
                    {featuredMaterials[0].thumbnailUrl ? (
                      <img src={featuredMaterials[0].thumbnailUrl} alt={featuredMaterials[0].title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className={`w-full h-full absolute inset-0 flex items-center justify-center ${featuredMaterials[0].type === 'video' ? 'bg-indigo-100 text-indigo-300' : 'bg-fuchsia-100 text-fuchsia-300'}`}>
                        {featuredMaterials[0].type === 'video' ? <PlayCircle className="w-24 h-24" /> : <FileText className="w-24 h-24" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent z-10 transition-opacity group-hover:opacity-90"></div>
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 z-20">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-4 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 backdrop-blur-md ${featuredMaterials[0].type === 'video' ? 'bg-indigo-500/90 text-white' : 'bg-fuchsia-500/90 text-white'}`}>
                          {featuredMaterials[0].type === 'video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          {featuredMaterials[0].type === 'video' ? 'Video' : 'Artikel'}
                        </span>
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> {featuredMaterials[0].course}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 line-clamp-2 leading-tight">{featuredMaterials[0].title}</h3>
                      <div className="flex items-center gap-5 text-slate-200 text-sm font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg backdrop-blur-md"><Heart className="w-4 h-4 fill-red-500 text-red-500" /> {featuredMaterials[0].likes || 0} Membantu</span>
                        <span className="text-white font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg">{formatPrice(featuredMaterials[0].price)}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-col gap-6 h-auto lg:h-full">
                    {featuredMaterials.slice(1, 3).map((item) => (
                      <Link key={item.id} href={`/${item.type}/${item.id}`} className="group cursor-pointer block relative rounded-[2rem] overflow-hidden h-[200px] lg:flex-1 shadow-sm">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className={`w-full h-full absolute inset-0 flex items-center justify-center ${item.type === 'video' ? 'bg-indigo-100 text-indigo-300' : 'bg-fuchsia-100 text-fuchsia-300'}`}>
                            {item.type === 'video' ? <PlayCircle className="w-16 h-16" /> : <FileText className="w-16 h-16" />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 to-slate-900/10 z-10"></div>
                        <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                          <span className={`px-3 py-1 text-[10px] font-bold rounded-lg mb-3 inline-flex items-center gap-1.5 backdrop-blur-md ${item.type === 'video' ? 'bg-indigo-500/90 text-white' : 'bg-fuchsia-500/90 text-white'}`}>
                            {item.type === 'video' ? <PlayCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} {item.type === 'video' ? 'Video' : 'Artikel'}
                          </span>
                          <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-snug">{item.title}</h3>
                          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 fill-red-500 text-red-500" /> {item.likes || 0}</span>
                            <span className="text-white font-bold bg-white/20 px-2.5 py-1 rounded-md">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {validFeatured && (
              <div className="hidden md:flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900">Jelajahi Semua Materi</h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {gridMaterials.flatMap((item, idx) => {
                  const elements = [renderCard(item)];

                  if (idx === 4 && gridMaterials.length > 5) {
                    elements.push(
                      <motion.div
                        key="cta-banner"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="col-span-1 md:col-span-2 lg:col-span-3 my-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2.5rem] p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center"
                      >
                        <Sparkles className="absolute top-6 left-12 w-10 h-10 text-white/30" />
                        <Sparkles className="absolute bottom-8 right-16 w-14 h-14 text-white/20" />
                        <h3 className="text-3xl md:text-4xl font-extrabold mb-4 relative z-10 leading-tight">Masih Pusing Sama Materi?</h3>
                        <p className="text-white/90 font-medium max-w-xl mx-auto mb-8 relative z-10 text-lg">Jangan dipendam sendiri. Mending lempar aja request materi ke kreator lain, siapa tau ada si paling ambis yang siap bantu buatin rangkuman atau videonya!</p>
                        <Link href="/create-request" className="inline-flex px-10 py-4 bg-white text-indigo-600 font-extrabold rounded-full hover:scale-105 hover:shadow-2xl hover:shadow-white/20 transition-all shadow-lg cursor-pointer relative z-10 items-center gap-2">
                          <PlusCircle className="w-6 h-6" /> Lempar Request Sekarang
                        </Link>
                      </motion.div>
                    );
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="text-center mt-16">
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="px-8 py-4 bg-indigo-600 text-white font-extrabold rounded-full hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer"
                >
                  Tampilkan Lebih Banyak Materi
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <span className="hidden md:block">
          {BACKGROUND_SCRIBBLES.map((scribble, idx) => (
            <img
              key={`scribble-${idx}`}
              src={scribble.src}
              alt=""
              className="absolute drop-shadow-sm mix-blend-multiply"
              style={{
                top: scribble.top,
                left: scribble.left,
                width: scribble.width,
                opacity: scribble.opacity,
                transform: `rotate(${scribble.rotate})`
              }}
            />
          ))}
        </span>

        {BACKGROUND_FORMULAS.map((item, idx) => (
          <motion.div
            key={`formula-${idx}`}
            className="absolute text-3xl md:text-4xl text-slate-900/10 font-bold whitespace-nowrap"
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
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-slate-50 relative w-full">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center relative z-10 bg-slate-50">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      }>
        <ExploreContent />
      </Suspense>
    </div>
  );
}