export const JURUSAN_LIST = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Ilmu Komputer",
  "Manajemen",
  "Akuntansi",
  "Ilmu Komunikasi",
  "Ilmu Hukum",
  "Kedokteran",
  "Psikologi",
  "Teknik Sipil",
  "Teknik Industri",
  "Teknik Mesin",
  "Teknik Elektro",
  "Hubungan Internasional",
  "Administrasi Bisnis",
  "Desain Komunikasi Visual (DKV)",
  "Sastra Inggris",
  "Farmasi",
  "Keperawatan",
  "Ilmu Pemerintahan",
  "Lainnya"
] as const;

export type Jurusan = typeof JURUSAN_LIST[number];