"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, FileText, Star,
  Tag, GraduationCap, X, Sparkles, PlusCircle, Heart, Search, Flame, Zap, TrendingUp
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

const FILTER_CHIPS = [
  { label: "Semua", type: "all", price: "all" },
  { label: "Video", type: "video", price: "all" },
  { label: "Artikel", type: "post", price: "all" },
  { label: "Gratis", type: "all", price: "free" },
  { label: "Premium", type: "all", price: "paid" },
];

const SORT_CHIPS = [
  { label: "🔥 Terpopuler", value: "popular" },
  { label: "✨ Terbaru", value: "newest" },
];

function getBadge(item: Material, idx: number) {
  if (idx === 0) return { label: "🔥 Trending", bg: "bg-orange-500", text: "text-white" };
  if (idx === 1) return { label: "⚡ Hot", bg: "bg-rose-500", text: "text-white" };
  if (idx === 2) return { label: "🌟 Terlaris", bg: "bg-amber-400", text: "text-slate-900" };
  return null;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearchQuery = searchParams.get("search") || "";

  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const [activeChip, setActiveChip] = useState(0);
  const [activeSort, setActiveSort] = useState("popular");
  const [activeJurusan, setActiveJurusan] = useState<Jurusan | "">("");
  const [jurusanOpen, setJurusanOpen] = useState(false);

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

  const handleChipClick = (idx: number) => {
    setActiveChip(idx);
    const chip = FILTER_CHIPS[idx];
    setFilters(prev => ({ ...prev, type: chip.type, price: chip.price }));
  };

  const handleSortClick = (val: string) => {
    setActiveSort(val);
    setFilters(prev => ({ ...prev, sort: val }));
  };

  const handleJurusanClick = (j: Jurusan | "") => {
    setActiveJurusan(j);
    setFilters(prev => ({ ...prev, jurusan: j }));
    setJurusanOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({ type: "all", jurusan: "", price: "all", sort: "popular" });
    setActiveChip(0);
    setActiveSort("popular");
    setActiveJurusan("");
    if (urlSearchQuery) router.push('/explore');
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Gratis";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const hasActiveFilters = filters.type !== "all" || filters.jurusan !== "" || filters.price !== "all" || filters.sort !== "popular" || urlSearchQuery !== "";
  const isDefaultView = filters.sort === "popular" && urlSearchQuery === "" && filters.type === "all" && filters.jurusan === "" && filters.price === "all";
  const validFeatured = isDefaultView && filteredMaterials.length >= 3;

  const featuredMaterials = validFeatured ? filteredMaterials.slice(0, 3) : [];
  const gridMaterials = filteredMaterials.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMaterials.length;

  // Regular card for the grid
  const renderCard = (item: Material, idx: number) => {
    const badge = getBadge(item, filteredMaterials.indexOf(item));
    const isVideo = item.type === "video";
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22, delay: idx * 0.04 }}
        key={item.id}
        className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        style={{ boxShadow: "0 2px 8px 0 rgba(80,60,180,0.04)" }}
      >
        <Link href={`/${item.type}/${item.id}`} className="flex flex-col h-full w-full">
          {/* Thumbnail */}
          <div className="relative w-full h-44 overflow-hidden">
            {item.thumbnailUrl ? (
              <>
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              </>
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${isVideo ? "bg-indigo-50" : "bg-fuchsia-50"}`}>
                {isVideo
                  ? <PlayCircle className="w-12 h-12 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                  : <FileText className="w-12 h-12 text-fuchsia-200 group-hover:text-fuchsia-400 transition-colors" />
                }
              </div>
            )}

            {/* Type pill */}
            <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${isVideo ? "bg-indigo-600 text-white" : "bg-fuchsia-600 text-white"}`}>
                {isVideo ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {isVideo ? "Video" : "Artikel"}
              </span>
              {badge && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              )}
            </div>

            {/* Likes */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
              <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {item.likes || 0}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md line-clamp-1 max-w-[55%] flex items-center gap-1">
                <Tag className="w-2.5 h-2.5 shrink-0" /> {item.course}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg shrink-0 ${!item.price || item.price === 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                {formatPrice(item.price)}
              </span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 mb-1.5 line-clamp-2 leading-snug">{item.title}</h3>
            <p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1">{item.description}</p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                  {(item as any).authorName?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-[11px] font-medium text-slate-500 line-clamp-1">{(item as any).authorName || "Anonim"}</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${isVideo ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white" : "bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white"}`}>
                Buka →
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="w-full relative z-10 pb-16 pt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">

        {/* Header */}
        {/* <div className="mb-6 md:mb-10">
          <div className="hidden md:block text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
              Eksplorasi <span className="text-indigo-500">Materi Kuliah</span>
            </h1>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              Temukan video & rangkuman dari mahasiswa lain. Belajar jadi lebih relate dan gampang masuk otak!
            </p>
          </div>
          <div className="block md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900 leading-snug">
                  Temukan video & rangkuman<br />dari mahasiswa lain.
                </h1>
              </div>
              <img src="/images/explore/booknobg.png" alt="" className="w-20 h-20 shrink-0 object-contain mix-blend-multiply" />
            </div>
          </div>

          {urlSearchQuery && (
            <div className="mt-5 flex md:justify-center">
              <span className="font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2 text-sm">
                <Search className="w-4 h-4 shrink-0" /> Hasil: "{urlSearchQuery}"
              </span>
            </div>
          )}
        </div> */}

        {/* ===== STICKY FILTER BAR ===== */}
        <div className="sticky top-[72px] z-30 mb-8">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">

              {/* Content type + price chips */}
              {FILTER_CHIPS.map((chip, idx) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(idx)}
                  className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    activeChip === idx
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-1" />

              {/* Sort chips */}
              {SORT_CHIPS.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleSortClick(s.value)}
                  className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    activeSort === s.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-1" />

              {/* Jurusan dropdown as chip */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setJurusanOpen(!jurusanOpen)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeJurusan
                      ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  🎓 {activeJurusan || "Jurusan"}
                  {activeJurusan && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleJurusanClick(""); }}
                      className="ml-1 text-white/80 hover:text-white"
                    >×</span>
                  )}
                </button>
                <AnimatePresence>
                  {jurusanOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                    >
                      <div className="p-2">
                        <button onClick={() => handleJurusanClick("")} className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded-xl font-medium">
                          Semua Jurusan
                        </button>
                        {JURUSAN_LIST.map(j => (
                          <button
                            key={j}
                            onClick={() => handleJurusanClick(j)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer ${activeJurusan === j ? "bg-violet-50 text-violet-700 font-bold" : "hover:bg-slate-50 text-slate-700"}`}
                          >
                            {j}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reset */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleResetFilters}
                    className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <X className="w-3 h-3" /> Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="w-full h-44 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-8 bg-slate-100 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="w-20 h-20 inline-flex items-center justify-center mb-5 bg-indigo-50 rounded-2xl">
              <FileText className="w-10 h-10 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Materi Tidak Ditemukan</h2>
            <p className="text-slate-400 mb-7 max-w-sm mx-auto text-sm">Belum ada yang bahas nih. Mau request ke kreator lain?</p>
            <Link href="/create-request" className="inline-flex px-7 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all items-center gap-2 text-sm">
              <PlusCircle className="w-4 h-4" /> Buat Request Materi
            </Link>
          </motion.div>
        ) : (
          <>
            {/* ===== TOP OF THE WEEK — BENTO GRID ===== */}
            {validFeatured && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base font-extrabold text-slate-900">Top of the Week</span>
                  <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Trending minggu ini
                  </span>
                </div>

                {/* Bento layout */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:h-[400px]">

                  {/* Big card — spans 2 rows on desktop */}
                  <Link
                    href={`/${featuredMaterials[0].type}/${featuredMaterials[0].id}`}
                    className="col-span-2 lg:col-span-2 lg:row-span-2 group block relative rounded-2xl overflow-hidden h-[220px] lg:h-full cursor-pointer"
                  >
                    {featuredMaterials[0].thumbnailUrl ? (
                      <img src={featuredMaterials[0].thumbnailUrl} alt={featuredMaterials[0].title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className={`w-full h-full absolute inset-0 flex items-center justify-center ${featuredMaterials[0].type === "video" ? "bg-indigo-100" : "bg-fuchsia-100"}`}>
                        {featuredMaterials[0].type === "video" ? <PlayCircle className="w-20 h-20 text-indigo-300" /> : <FileText className="w-20 h-20 text-fuchsia-300" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-orange-500 text-white flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Trending
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${featuredMaterials[0].type === "video" ? "bg-indigo-600 text-white" : "bg-fuchsia-600 text-white"} flex items-center gap-1`}>
                        {featuredMaterials[0].type === "video" ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {featuredMaterials[0].type === "video" ? "Video" : "Artikel"}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-slate-300 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {featuredMaterials[0].course}
                        </span>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-extrabold text-white mb-2 line-clamp-2 leading-tight">{featuredMaterials[0].title}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white">
                            {(featuredMaterials[0] as any).authorName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs text-slate-300">{(featuredMaterials[0] as any).authorName || "Anonim"}</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-slate-300">
                          <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" /> {featuredMaterials[0].likes || 0}
                        </span>
                        <span className={`ml-auto text-xs font-extrabold px-3 py-1 rounded-xl ${!featuredMaterials[0].price || featuredMaterials[0].price === 0 ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>
                          {formatPrice(featuredMaterials[0].price)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Two smaller cards stacked */}
                  {featuredMaterials.slice(1, 3).map((item, sIdx) => (
                    <Link
                      key={item.id}
                      href={`/${item.type}/${item.id}`}
                      className="group block relative rounded-2xl overflow-hidden h-[190px] lg:h-auto cursor-pointer"
                    >
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full absolute inset-0 flex items-center justify-center ${item.type === "video" ? "bg-indigo-100" : "bg-fuchsia-100"}`}>
                          {item.type === "video" ? <PlayCircle className="w-12 h-12 text-indigo-200" /> : <FileText className="w-12 h-12 text-fuchsia-200" />}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />
                      {sIdx === 0 && (
                        <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-500 text-white flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" /> Hot
                        </span>
                      )}
                      {sIdx === 1 && (
                        <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-400 text-slate-900">
                          🌟 Terlaris
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md mb-2 inline-flex items-center gap-1 ${item.type === "video" ? "bg-indigo-600 text-white" : "bg-fuchsia-600 text-white"}`}>
                          {item.type === "video" ? <PlayCircle className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                          {item.type === "video" ? "Video" : "Artikel"}
                        </span>
                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-2">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold text-white">
                              {(item as any).authorName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-[10px] text-slate-300">{(item as any).authorName || "Anonim"}</span>
                          </div>
                          <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${!item.price || item.price === 0 ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section header for grid */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900">
                  {validFeatured ? "Jelajahi Semua Materi" : "Materi"}
                </span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredMaterials.length} materi
                </span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {gridMaterials.flatMap((item, idx) => {
                  const elements = [renderCard(item, idx)];

                  if (idx === 4 && gridMaterials.length > 5) {
                    elements.push(
                      <motion.div
                        key="cta-banner"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-1 sm:col-span-2 lg:col-span-3 my-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-2xl p-8 text-center text-white relative overflow-hidden flex flex-col items-center justify-center"
                      >
                        <Sparkles className="absolute top-4 left-10 w-8 h-8 text-white/20" />
                        <Sparkles className="absolute bottom-5 right-14 w-10 h-10 text-white/15" />
                        <h3 className="text-2xl font-extrabold mb-2 relative z-10">Masih Pusing Sama Materi?</h3>
                        <p className="text-white/80 max-w-md mx-auto mb-6 relative z-10 text-sm">Jangan dipendam sendiri. Lempar request ke kreator lain, siapa tau ada yang siap bantu buatin rangkuman!</p>
                        <Link href="/create-request" className="inline-flex px-8 py-3 bg-white text-indigo-600 font-extrabold rounded-full hover:scale-105 transition-all shadow-lg cursor-pointer items-center gap-2 text-sm">
                          <PlusCircle className="w-4 h-4" /> Lempar Request Sekarang
                        </Link>
                      </motion.div>
                    );
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 hover:shadow-lg transition-all cursor-pointer text-sm"
                >
                  Tampilkan Lebih Banyak
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Background decorations — unchanged */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <span className="hidden md:block">
          {BACKGROUND_SCRIBBLES.map((scribble, idx) => (
            <img
              key={`scribble-${idx}`}
              src={scribble.src}
              alt=""
              className="absolute drop-shadow-sm mix-blend-multiply"
              style={{ top: scribble.top, left: scribble.left, width: scribble.width, opacity: scribble.opacity, transform: `rotate(${scribble.rotate})` }}
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