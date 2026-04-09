"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Instagram, Linkedin, Sun, Moon, Sparkles, Code2, BookOpen, Users, Zap, Globe } from "lucide-react";

const founders = [
    {
        name: "Haidar Hanif Wahyudi",
        role: "Chief Executive Officer",
        tag: "CEO",
        photo: "/about/foto1.png",
        ig: "https://instagram.com/",
        linkedin: "https://linkedin.com/in/",
        color: "#4f46e5",
        lightBg: "from-indigo-50 to-violet-50",
        darkBg: "from-indigo-950/60 to-violet-950/60",
        accent: "indigo",
        tagColor: "bg-indigo-100 text-indigo-700",
        tagColorDark: "bg-indigo-900/50 text-indigo-300",
        quote: "Belajar itu paling asik kalau dari orang yang pernah ngerasain hal yang sama.",
        emoji: "🚀",
        skills: ["Vision", "Leadership", "Strategy"],
    },
    {
        name: "Muhammad Radya Iftikhar",
        role: "Chief Technology Officer",
        tag: "CTO",
        photo: "/about/foto1.png",
        ig: "https://instagram.com/",
        linkedin: "https://linkedin.com/in/",
        color: "#7c3aed",
        lightBg: "from-violet-50 to-fuchsia-50",
        darkBg: "from-violet-950/60 to-fuchsia-950/60",
        accent: "violet",
        tagColor: "bg-violet-100 text-violet-700",
        tagColorDark: "bg-violet-900/50 text-violet-300",
        quote: "Kode yang bagus bukan cuma yang berjalan, tapi yang bisa dimengerti siapapun.",
        emoji: "⚡",
        skills: ["Engineering", "Architecture", "Innovation"],
    },
    {
        name: "Anggun Oktaviana",
        role: "General Founder",
        tag: "Founder",
        photo: "/about/foto1.png",
        ig: "https://instagram.com/",
        linkedin: "https://linkedin.com/in/",
        color: "#db2777",
        lightBg: "from-pink-50 to-rose-50",
        darkBg: "from-pink-950/60 to-rose-950/60",
        accent: "pink",
        tagColor: "bg-pink-100 text-pink-700",
        tagColorDark: "bg-pink-900/50 text-pink-300",
        quote: "Platform ini lahir dari rasa frustrasi yang sama — materi kuliah yang susah banget dipahami.",
        emoji: "✨",
        skills: ["Growth", "Community", "Brand"],
    },
];

function FloatingParticle({ dark }: { dark: boolean }) {
    const symbols = ["∫", "Σ", "∞", "∂", "π", "λ", "α", "β", "∇", "⊕"];
    const items = Array.from({ length: 18 }, (_, i) => ({
        symbol: symbols[i % symbols.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        size: 10 + Math.random() * 14,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    className={`absolute font-mono select-none ${dark ? "text-white/5" : "text-slate-900/5"}`}
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        fontSize: `${item.size}px`,
                    }}
                    animate={{
                        y: [-20, 20, -20],
                        opacity: [0.03, 0.1, 0.03],
                        rotate: [-10, 10, -10],
                    }}
                    transition={{
                        duration: item.duration,
                        delay: item.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    {item.symbol}
                </motion.div>
            ))}
        </div>
    );
}

function FounderCard({ founder, index, dark }: { founder: (typeof founders)[0]; index: number; dark: boolean }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-150, 150], [12, -12]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-12, 12]), { stiffness: 300, damping: 30 });
    const glowX = useTransform(mouseX, [-150, 150], [0, 100]);
    const glowY = useTransform(mouseY, [-150, 150], [0, 100]);

    const handleMouseMove = (e: React.MouseEvent) => {
        // if (!cardRef.current) return;
        // const rect = cardRef.current.getBoundingClientRect();
        // const centerX = rect.left + rect.width / 2;
        // const centerY = rect.top + rect.height / 2;
        // mouseX.set(e.clientX - centerX);
        // mouseY.set(e.clientY - centerY);
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-w-[280px] max-w-[380px]"
        >
            <motion.div
                ref={cardRef}
                style={{ rotateX, rotateY, transformPerspective: 800 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                whileHover={{ scale: 1.02 }}
                className="relative cursor-pointer"
            >
                {/* glow bg */}
                <motion.div
                    className="absolute -inset-1 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                    style={{
                        background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${founder.color}40, transparent 70%)`,
                    }}
                />

                <div
                    className={`relative rounded-[2.5rem] overflow-hidden border transition-all duration-300 ${dark
                            ? "bg-slate-900/80 border-slate-700/50 backdrop-blur-xl"
                            : "bg-white/90 border-slate-200/80 backdrop-blur-xl shadow-xl shadow-slate-200/60"
                        }`}
                >
                    {/* top gradient strip */}
                    <div
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-[2.5rem]"
                        style={{ background: `linear-gradient(90deg, ${founder.color}, ${founder.color}88)` }}
                    />

                    {/* shimmer on hover */}
                    <motion.div
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${founder.color}15, transparent 60%)`,
                        }}
                        whileHover={{ opacity: 1 }}
                    />

                    <div className="p-8">
                        {/* Photo */}
                        <div className="relative mb-6 flex justify-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative w-32 h-32"
                            >
                                <div
                                    className="absolute inset-0 rounded-full blur-md opacity-40"
                                    style={{ background: founder.color }}
                                />
                                <div
                                    className="relative w-32 h-32 rounded-full overflow-hidden border-4"
                                    style={{ borderColor: founder.color + "60" }}
                                >
                                    <img
                                        src={founder.photo}
                                        alt={founder.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=${founder.color.slice(1)}&color=fff&size=128&bold=true`;
                                        }}
                                    />
                                </div>
                                {/* emoji badge */}
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
                                    style={{
                                        background: dark ? "#1e293b" : "#fff",
                                        borderColor: founder.color + "60",
                                    }}
                                >
                                    {founder.emoji}
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Role tag */}
                        <div className="flex justify-center mb-3">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${dark ? founder.tagColorDark : founder.tagColor
                                    }`}
                            >
                                {founder.tag}
                            </span>
                        </div>

                        {/* Name */}
                        <h3
                            className={`text-xl font-extrabold text-center mb-1 ${dark ? "text-white" : "text-slate-900"
                                }`}
                        >
                            {founder.name}
                        </h3>
                        <p
                            className={`text-sm font-semibold text-center mb-5 ${dark ? "text-slate-400" : "text-slate-500"
                                }`}
                        >
                            {founder.role}
                        </p>

                        {/* Quote */}
                        <div
                            className={`p-4 rounded-2xl mb-6 relative ${dark ? "bg-slate-800/60" : "bg-slate-50/80"
                                }`}
                        >
                            <div
                                className="absolute top-3 left-3 text-3xl font-serif leading-none opacity-30"
                                style={{ color: founder.color }}
                            >
                                "
                            </div>
                            <p
                                className={`text-sm leading-relaxed pl-4 italic ${dark ? "text-slate-300" : "text-slate-600"
                                    }`}
                            >
                                {founder.quote}
                            </p>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-6 justify-center">
                            {founder.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${dark
                                            ? "border-slate-700 text-slate-400 bg-slate-800/50"
                                            : "border-slate-200 text-slate-500 bg-white"
                                        }`}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {/* Socials */}
                        <div className="flex gap-3 justify-center">
                            <motion.a
                                href={founder.ig}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${dark
                                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-pink-400"
                                        : "bg-slate-100 hover:bg-pink-50 text-slate-500 hover:text-pink-500"
                                    }`}
                            >
                                <Instagram className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                href={founder.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${dark
                                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400"
                                        : "bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600"
                                    }`}
                            >
                                <Linkedin className="w-4 h-4" />
                            </motion.a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

const stats = [
    { icon: Users, value: "500+", label: "Mahasiswa Aktif", color: "text-indigo-500" },
    { icon: BookOpen, value: "1,200+", label: "Materi Tersedia", color: "text-violet-500" },
    { icon: Zap, value: "98%", label: "Kepuasan User", color: "text-pink-500" },
    { icon: Globe, value: "20+", label: "Kampus", color: "text-emerald-500" },
];

export default function AboutPage() {
    const [dark, setDark] = useState(false);

    return (
        <div
            className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
                }`}
        >
            {/* Floating math particles */}
            <FloatingParticle dark={dark} />

            {/* Mesh gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute top-[-15%] left-[-10%] w-[50rem] h-[50rem] rounded-full blur-[120px] ${dark ? "bg-indigo-900/30" : "bg-indigo-100/70"
                        }`}
                />
                <motion.div
                    animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className={`absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] rounded-full blur-[120px] ${dark ? "bg-fuchsia-900/30" : "bg-fuchsia-100/70"
                        }`}
                />
                <motion.div
                    animate={{ x: [0, 15, 0], y: [0, -30, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                    className={`absolute top-[40%] left-[30%] w-[35rem] h-[35rem] rounded-full blur-[100px] ${dark ? "bg-violet-900/20" : "bg-violet-100/50"
                        }`}
                />
            </div>

            {/* Dark mode toggle */}
            <div className="sticky top-[20px] z-50 flex justify-end px-6 pt-4">
                <motion.button
                    onClick={() => setDark(!dark)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border shadow-lg ${dark
                            ? "bg-slate-800 border-slate-700 text-yellow-300 hover:bg-slate-700"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-200"
                        }`}
                >
                    <AnimatePresence mode="wait">
                        {dark ? (
                            <motion.div
                                key="sun"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Sun className="w-4 h-4" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="moon"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon className="w-4 h-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {dark ? "Light Mode" : "Dark Mode"}
                </motion.button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-8 border ${dark
                                ? "bg-indigo-900/40 border-indigo-700/50 text-indigo-300"
                                : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        The Team Behind TukarIlmu
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none"
                    >
                        <span className={dark ? "text-white" : "text-slate-900"}>Dibuat oleh </span>
                        <span className="relative inline-block">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500">
                                Mahasiswa
                            </span>
                            <motion.div
                                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                            />
                        </span>
                        <span className={dark ? "text-white" : "text-slate-900"}>,</span>
                        <br />
                        <span className={dark ? "text-white" : "text-slate-900"}>untuk Mahasiswa.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"
                            }`}
                    >
                        TukarIlmu lahir dari satu keyakinan sederhana — bahwa penjelasan terbaik datang dari orang yang baru saja melewati hal yang sama.
                    </motion.p>
                </div>

                {/* Stats */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-24 p-6 rounded-[2rem] border ${dark
                            ? "bg-slate-900/60 border-slate-800 backdrop-blur-xl"
                            : "bg-white/70 border-slate-200/80 backdrop-blur-xl shadow-xl shadow-slate-200/40"
                        }`}
                >
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center py-4"
                        >
                            <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
                            <p className={`text-3xl font-extrabold mb-1 ${dark ? "text-white" : "text-slate-900"}`}>
                                {s.value}
                            </p>
                            <p className={`text-xs font-semibold text-center ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                {s.label}
                            </p>
                        </motion.div>
                    ))}
                </motion.div> */}

                {/* Founders */}
                <div className="mb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h2 className={`text-3xl md:text-4xl font-extrabold mb-3 ${dark ? "text-white" : "text-slate-900"}`}>
                            Meet the Founders 👋
                        </h2>
                        <p className={`text-base ${dark ? "text-slate-500" : "text-slate-400"}`}>
                            Tiga orang, satu visi — bikin belajar jadi lebih relate.
                        </p>
                    </motion.div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch flex-wrap">
                        {founders.map((founder, index) => (
                            <FounderCard key={founder.name} founder={founder} index={index} dark={dark} />
                        ))}
                    </div>
                </div>

                {/* Story Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className={`relative rounded-[2.5rem] p-10 md:p-16 overflow-hidden border ${dark
                            ? "bg-slate-900/60 border-slate-800 backdrop-blur-xl"
                            : "bg-white/80 border-slate-200/80 backdrop-blur-xl shadow-2xl shadow-slate-200/40"
                        }`}
                >
                    {/* decorative corner */}
                    <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-500/10 via-violet-500/5 to-transparent rounded-bl-full" />
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <h3 className={`text-2xl md:text-3xl font-extrabold ${dark ? "text-white" : "text-slate-900"}`}>
                            Cerita di Balik Platform
                        </h3>
                    </div>

                    <div className={`space-y-5 text-base md:text-lg leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>
                        <p>
                            Semuanya bermula dari frustrasi yang sama — duduk di kelas, dengerin dosen, tapi masih aja bingung. Cari di YouTube? Kebanyakan bahasa Inggris atau terlalu umum. Minta tolong teman? Nggak semua orang punya waktu.
                        </p>
                        <p>
                            TukarIlmu hadir sebagai jawaban: platform di mana mahasiswa bisa berbagi penjelasan materi kuliah dalam bahasa yang lebih <em>relate</em> — karena yang jelasin juga baru ngerasain hal yang sama.
                        </p>
                        <p>
                            Tim kecil kami percaya bahwa ilmu terbaik adalah ilmu yang dibagikan. Dan ketika kamu bantu orang lain paham, kamu juga makin paham.
                        </p>
                    </div>

                    {/* timeline dots */}
                    <div className="mt-12 flex flex-col sm:flex-row gap-6">
                        {[
                            { year: "2024", event: "Ide pertama muncul di kelas yang bikin pusing" },
                            { year: "2025", event: "TukarIlmu resmi diluncurkan" },
                            { year: "Now", event: "Terus berkembang bareng komunitas mahasiswa" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.15 }}
                                className={`flex-1 p-5 rounded-2xl border ${dark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
                                    }`}
                            >
                                <p className="text-indigo-500 font-extrabold text-lg mb-1">{item.year}</p>
                                <p className={`text-sm font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                    {item.event}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}