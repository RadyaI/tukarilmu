import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Nama Website",
  description: "Kebijakan privasi penggunaan layanan kami.",
};

const sections = [
  {
    id: "informasi",
    num: "01",
    title: "Informasi yang Kami Kumpulkan",
    content: `Kami mengumpulkan beberapa jenis informasi untuk memberikan dan meningkatkan layanan kami kepada Anda.

Informasi yang Anda berikan secara langsung, seperti nama, alamat email, dan informasi profil saat mendaftar. Data penggunaan yang dikumpulkan secara otomatis, termasuk alamat IP, jenis browser, halaman yang dikunjungi, waktu dan tanggal kunjungan, serta durasi waktu yang dihabiskan di halaman tersebut.

Kami juga dapat mengumpulkan informasi dari cookies dan teknologi pelacakan serupa untuk meningkatkan pengalaman pengguna di platform kami.`,
  },
  {
    id: "penggunaan",
    num: "02",
    title: "Cara Kami Menggunakan Informasi",
    content: `Informasi yang kami kumpulkan digunakan untuk berbagai keperluan operasional dan peningkatan layanan.

Kami menggunakan data Anda untuk menyediakan, memelihara, dan meningkatkan layanan; memproses transaksi dan mengirimkan informasi terkait; mengirimkan pemberitahuan teknis dan pesan dukungan; merespons komentar dan pertanyaan Anda; serta memantau dan menganalisis tren penggunaan.

Data tidak akan dijual kepada pihak ketiga untuk keperluan pemasaran tanpa persetujuan eksplisit dari Anda.`,
  },
  {
    id: "cookies",
    num: "03",
    title: "Cookies & Teknologi Pelacakan",
    content: `Kami menggunakan cookies dan teknologi serupa untuk melacak aktivitas di layanan kami dan menyimpan informasi tertentu.

Cookies adalah file dengan sejumlah kecil data yang dapat mencakup pengenal unik anonim. Cookies dikirimkan ke browser Anda dari situs web dan disimpan di perangkat Anda. Anda dapat menginstruksikan browser Anda untuk menolak semua cookies atau untuk menunjukkan kapan cookie sedang dikirimkan.

Jika Anda tidak menerima cookies, Anda mungkin tidak dapat menggunakan beberapa bagian dari layanan kami.`,
  },
  {
    id: "pihak-ketiga",
    num: "04",
    title: "Berbagi Data dengan Pihak Ketiga",
    content: `Kami dapat berbagi informasi pribadi Anda dalam situasi tertentu yang telah kami uraikan di bawah ini.

Dengan penyedia layanan: Kami dapat berbagi data pribadi Anda dengan penyedia layanan pihak ketiga yang membantu kami mengoperasikan platform, seperti layanan hosting, analitik, dan pembayaran. Penyedia ini hanya memiliki akses ke informasi yang diperlukan untuk menjalankan fungsi mereka.

Dalam kasus hukum: Kami dapat mengungkapkan informasi Anda jika diwajibkan oleh hukum atau sebagai respons atas permintaan yang sah dari otoritas publik.`,
  },
  {
    id: "keamanan",
    num: "05",
    title: "Keamanan Data",
    content: `Keamanan data Anda penting bagi kami, namun perlu diingat bahwa tidak ada metode transmisi melalui Internet atau metode penyimpanan elektronik yang 100% aman.

Kami menggunakan enkripsi SSL/TLS untuk melindungi data yang dikirimkan antara browser Anda dan server kami. Akses ke data pribadi dibatasi hanya untuk karyawan yang membutuhkan akses tersebut untuk menjalankan pekerjaan mereka.

Kami secara rutin meninjau praktik keamanan kami dan memperbarui langkah-langkah perlindungan sesuai kebutuhan.`,
  },
  {
    id: "hak",
    num: "06",
    title: "Hak-Hak Anda",
    content: `Anda memiliki sejumlah hak sehubungan dengan data pribadi Anda yang kami proses.

Hak akses: Anda berhak meminta salinan informasi pribadi yang kami miliki tentang Anda. Hak koreksi: Anda berhak meminta kami mengoreksi data yang tidak akurat. Hak penghapusan: Anda berhak meminta kami menghapus data pribadi Anda dalam kondisi tertentu.

Untuk menggunakan hak-hak ini, silakan hubungi kami melalui informasi kontak yang tersedia di bagian bawah halaman ini.`,
  },
  {
    id: "perubahan",
    num: "07",
    title: "Perubahan Kebijakan Privasi",
    content: `Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini.

Kami akan memberi tahu Anda melalui email dan/atau pemberitahuan menonjol di layanan kami, sebelum perubahan menjadi efektif, dan memperbarui tanggal "terakhir diperbarui" di bagian atas Kebijakan Privasi ini.

Anda disarankan untuk meninjau Kebijakan Privasi ini secara berkala untuk setiap perubahan.`,
  },
  {
    id: "kontak",
    num: "08",
    title: "Hubungi Kami",
    content: `Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami.

Email: privacy@namawebsite.com
Alamat: Jl. Contoh No. 123, Kota, Indonesia
Telepon: +62 812 3456 7890

Kami berkomitmen untuk merespons setiap pertanyaan atau keluhan terkait privasi dalam waktu 30 hari kerja sejak diterimanya pesan Anda.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* ── Header ── */}
        <div className="mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-6">
            Legal
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Kebijakan Privasi
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Terakhir diperbarui: 4 Juni 2025</span>
            <span>·</span>
            <span>Versi 1.0</span>
          </div>

          <div className="mt-8 h-px bg-gray-200" />
        </div>

        {/* ── Intro ── */}
        <p className="text-gray-500 text-base leading-relaxed mb-12 max-w-2xl">
          Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi
          informasi pribadi Anda saat menggunakan layanan kami. Harap baca dengan seksama
          sebelum menggunakan platform ini.
        </p>

        {/* ── Table of Contents ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Daftar Isi</p>
          <ol className="space-y-1.5">
            {sections.map((sec) => (
              <li key={sec.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 tabular-nums w-5 shrink-0">{sec.num}</span>
                <a
                  href={`#${sec.id}`}
                  className="text-sm text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Sections ── */}
        <div className="flex flex-col gap-6">
          {sections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-xs font-semibold text-gray-300 tabular-nums shrink-0 mt-1 w-5">
                  {sec.num}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-gray-800 mb-3">
                    {sec.title}
                  </h2>
                  <div className="space-y-3">
                    {sec.content.split("\n\n").map((para, i) => (
                      <p key={i} className="text-sm text-gray-500 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Dengan menggunakan layanan kami, Anda menyetujui Kebijakan Privasi ini.
            <br />
            © {new Date().getFullYear()} Nama Website. Seluruh hak dilindungi.
          </p>
        </div>

      </div>
    </main>
  );
}