"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, Heart, Share2, ShoppingCart, UserCircle, Lock, CheckCircle2, GraduationCap, FileText } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPostById } from "../../../utils/posts";
import { checkHasPurchased, buyMaterial, getAuthorInfo, incrementLike } from "../../../utils/purchases";
import { Post } from "../../../types/post";

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [post, setPost] = useState<(Post & { id: string }) | null>(null);
  const [author, setAuthor] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const postId = params.id as string;
      const postData = await getPostById(postId);
      
      if (!postData) {
        router.push("/not-found");
        return;
      }
      setPost(postData);

      const authorData = await getAuthorInfo(postData.userId);
      setAuthor(authorData);

      const likedStatus = localStorage.getItem(`liked_post_${postId}`);
      if (likedStatus) setIsLiked(true);

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser && postData.price > 0) {
          if (currentUser.uid === postData.userId) {
            setHasPurchased(true);
          } else {
            const purchased = await checkHasPurchased(currentUser.uid, postId);
            setHasPurchased(purchased);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initData();
  }, [params.id, router]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link materi berhasil disalin!", {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  const handleLike = async () => {
    if (isLiked || !post) return;
    try {
      await incrementLike("post", post.id);
      setIsLiked(true);
      setPost({ ...post, likes: post.likes + 1 });
      localStorage.setItem(`liked_post_${post.id}`, "true");
      toast.success("Terima kasih atas apresiasinya!");
    } catch (error) {
      toast.error("Gagal menyukai post");
    }
  };

  const handleBuy = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!post) return;

    const confirm = await Swal.fire({
      title: 'Beli Materi Ini?',
      text: `Saldo/Pembayaran sebesar Rp ${post.price.toLocaleString('id-ID')} akan diproses.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Beli Sekarang',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold', cancelButton: 'rounded-full px-6 py-2 font-bold' }
    });

    if (confirm.isConfirmed) {
      setIsProcessingBuy(true);
      toast.loading("Memproses pembelian...", { id: "buy-toast" });
      try {
        await buyMaterial(user.uid, post.userId, "post", post.id, post.price);
        setHasPurchased(true);
        toast.success("Pembelian berhasil! Selamat belajar.", { id: "buy-toast" });
        Swal.fire({
          title: 'Berhasil! 🎉',
          text: 'Materi ini sudah ditambahkan ke keranjang belajarmu.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-full px-6 py-2 font-bold' }
        });
      } catch (error) {
        toast.error("Gagal memproses pembelian.", { id: "buy-toast" });
      } finally {
        setIsProcessingBuy(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) return null;

  const isFree = post.price === 0;
  const canRead = isFree || hasPurchased;
  const previewContent = post.content.length > 300 ? post.content.substring(0, 300) + "..." : post.content;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-fuchsia-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Link href="/explore" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium mb-10 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Explore
        </Link>
        
        {post.thumbnailUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full aspect-[21/9] bg-slate-200 rounded-[2rem] overflow-hidden mb-10 shadow-lg">
            <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
          </motion.div>
        )}

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white p-6 sm:p-12 mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 font-bold text-xs rounded-lg flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Artikel
            </span>
            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> {post.course}
            </span>
            {post.jurusan && (
              <span className="px-3 py-1.5 bg-violet-50 text-violet-700 font-bold text-xs rounded-lg flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> {post.jurusan}
              </span>
            )}
            {isFree && (
              <span className="px-3 py-1.5 bg-green-50 text-green-700 font-bold text-xs rounded-lg">Gratis</span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">{post.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-100 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                {author?.avatar ? <img src={author.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : author?.name?.[0]?.toUpperCase() || <UserCircle className="w-8 h-8" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">{author?.name || "Kreator"}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  {author?.role === 'admin' ? <CheckCircle2 className="w-4 h-4 text-indigo-500" /> : null}
                  {author?.tag || "Mahasiswa"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handleLike} disabled={isLiked} className={`px-4 py-2.5 font-bold text-sm rounded-xl transition-all border flex items-center gap-2 cursor-pointer ${isLiked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm'}`}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} /> {post.likes}
              </button>
              <button onClick={handleShare} className="px-4 py-2.5 bg-white text-slate-600 font-bold text-sm rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200 flex items-center gap-2 cursor-pointer shadow-sm">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

          <div className="relative">
            <div className={`prose prose-slate prose-indigo max-w-none ${!canRead ? 'max-h-96 overflow-hidden' : ''}`} style={!canRead ? { maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' } : {}}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold mt-8 mb-4 text-slate-900 border-b pb-2 border-slate-100" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3 text-slate-800" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-5 mb-2 text-slate-800" {...props} />,
                  p: ({node, ...props}) => <p className="text-slate-600 leading-relaxed mb-5 text-lg" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside text-slate-600 mb-5 space-y-2 text-lg" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside text-slate-600 mb-5 space-y-2 text-lg" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  a: ({node, ...props}) => <a className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-300 underline-offset-2 transition-colors" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-slate-800" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 pl-5 py-2 italic text-slate-500 bg-indigo-50/50 rounded-r-xl my-6 text-lg" {...props} />,
                  code: ({node, inline, className, children, ...props}: any) => inline ? <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props}>{children}</code> : <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto mb-6 shadow-md"><code className="text-slate-50 font-mono text-sm leading-relaxed" {...props}>{children}</code></div>
                }}
              >
                {canRead ? post.content : previewContent}
              </ReactMarkdown>
            </div>

            {!canRead && (
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-4 pt-32 pointer-events-none">
                <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 text-center max-w-md w-full pointer-events-auto relative z-20 mx-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Materi Terkunci</h3>
                  <p className="text-slate-500 mb-6">Beli artikel ini untuk membaca keseluruhan materi dan panduan lengkapnya.</p>
                  
                  <div className="text-3xl font-extrabold text-slate-900 mb-6">
                    Rp {post.price.toLocaleString('id-ID')}
                  </div>

                  {!user ? (
                    <button onClick={() => router.push("/login")} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer">
                      Login untuk Membeli
                    </button>
                  ) : (
                    <button onClick={handleBuy} disabled={isProcessingBuy} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                      <ShoppingCart className="w-5 h-5" /> {isProcessingBuy ? "Memproses..." : "Beli Materi Ini"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}