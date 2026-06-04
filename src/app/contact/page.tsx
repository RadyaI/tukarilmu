"use client"

// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Contact Us — Nama Website",
//   description: "Hubungi kami untuk pertanyaan, saran, atau dukungan.",
// };

const contactItems = [
  {
    label: "Email",
    value: "cs@tukarilmu.com",
    sub: "Balas dalam 1-2 hari kerja",
    href: "mailto:cs@tukarilmu.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    value: "+62 812 3456 7890",
    sub: "Senin – Jumat, 09.00 – 17.00 WIB",
    href: "https://wa.me/6281234567890",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: "Alamat",
    value: "Jl. UMM No. 123",
    sub: "Kota, Indonesia 12345",
    href: "https://maps.google.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    value: "@tukarilmu",
    sub: "Follow untuk update terbaru",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "Berapa lama waktu respons?",
    a: "Kami biasanya merespons dalam 1–2 hari kerja via email. Untuk pertanyaan mendesak, gunakan WhatsApp.",
  },
  {
    q: "Apakah ada dukungan teknis?",
    a: "Ya, tim teknis kami siap membantu masalah terkait platform. Kirim detail masalah Anda ke email dukungan kami.",
  },
  {
    q: "Bagaimana cara melaporkan bug?",
    a: "Kirim laporan lengkap (screenshot + langkah reproduksi) ke email kami. Kami akan menindaklanjuti secepat mungkin.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-6">
            Kontak
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-5">
            Ada yang bisa<br />
            <span className="text-blue-600">kami bantu?</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-lg leading-relaxed">
            Kami senang mendengar dari Anda — baik itu pertanyaan, saran,
            atau sekadar ingin menyapa.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="grid md:grid-cols-5 gap-12 md:gap-16">

          {/* ── Left: Form ── */}
          <div className="md:col-span-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Kirim Pesan</h2>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@contoh.com"
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subjek
                </label>
                <input
                  type="text"
                  placeholder="Topik pesan Anda"
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pesan
                </label>
                <textarea
                  rows={5}
                  placeholder="Tuliskan pesan Anda di sini..."
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
              >
                Kirim Pesan
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>

          {/* ── Right: Contact Info ── */}
          <div className="md:col-span-2 flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-5">Info Kontak</h2>
              <div className="flex flex-col gap-3">
                {contactItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <span className="mt-0.5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Office hours */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                Jam Operasional
              </p>
              <div className="space-y-1 text-sm text-amber-800">
                <div className="flex justify-between">
                  <span>Senin – Jumat</span>
                  <span className="font-medium">09.00 – 17.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Sabtu</span>
                  <span className="font-medium">09.00 – 13.00</span>
                </div>
                <div className="flex justify-between text-amber-500">
                  <span>Minggu</span>
                  <span className="font-medium">Tutup</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-20">
          <div className="h-px bg-gray-100 mb-12" />
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
              FAQ
            </span>
            <h2 className="text-2xl font-bold text-gray-800">Pertanyaan Umum</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white transition-all"
              >
                <p className="text-sm font-semibold text-gray-800 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer note ── */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Tukar Ilmu. all right reserved.
          </p>
        </div>
      </div>
    </main>
  );
}