# Ruang Bernoulli: Misi Dadu

**LKM digital** (lembar kerja mahasiswa) untuk topik **Distribusi Bernoulli**.
Satu dadu bersisi enam, lima bagian lembar kerja, materi yang terbuka setelah siswa
menemukan sendiri konsepnya. Light mode, tanpa build, tanpa backend pada versi ini.

**Tim pengembang — Kelompok 9, Statistika Matematika 2026**
1. Ahmad As Siddiq (06081282429062)
2. Annisa Putri S. (06081282429036)
3. Fathia Aiva (06081382429083)
4. Sherin Az Zahra (06081382429085)

Program Studi Pendidikan Matematika · Fakultas Keguruan dan Ilmu Pendidikan · Universitas Sriwijaya

## Status

| Bagian | Status |
|---|---|
| Sampul LKM (identitas nama/NIM/kelas, tujuan, alat & bahan, petunjuk umum) | ✅ jalan |
| Bagian A — mengubah dadu menjadi 0/1, percobaan Bernoulli | ✅ jalan |
| Bagian B — statistik p̂ vs parameter p, kolom buatan siswa | ✅ jalan |
| Bagian C — prediksi terkunci → 100 lemparan → hukum bilangan besar & SE | ✅ jalan |
| Bagian D — tiga aturan sukses, fungsi likelihood, MLE | ✅ jalan |
| Bagian E — dua cara gabung data + pengantar Binomial | ✅ jalan |
| Lembar kerja per butir (teks/angka/tabel) + simpan otomatis | ✅ jalan |
| Panel **Materi** terkunci sampai semua butir bagian itu terjawab | ✅ jalan |
| Rumus KaTeX lokal (tanpa CDN) | ✅ jalan |
| Papan Data (PMF, konvergensi, tabel, kode laporan) | ✅ jalan |
| Alat pengembang `rekap.html` (tempel kode → tabel + CSV) | ✅ jalan |
| Pengumpulan jawaban ke server (Cloudflare D1) | ⏳ belum — jawaban tersimpan di perangkat |
| Deploy | ✅ https://misi-dadu.pages.dev |

**Alamat:** aplikasi https://misi-dadu.pages.dev · rekap https://misi-dadu.pages.dev/rekap.html
· mirror https://austinvinn.github.io/ruang-bernoulli-misi-dadu/

## Cara menjalankan

Tidak perlu build, tidak perlu server:

```
buka index.html langsung di browser
```

Semua aset lokal (tanpa CDN font/KaTeX), jadi tetap jalan offline.

## Struktur

```
index.html          kerangka + CSS (palet sage)
src/lkm-data.js     isi soal & materi Bagian A–E (pola discovery)
src/lkm.js          render butir, simpan jawaban, buka materi, render KaTeX
src/store.js        progres, status bagian, jawaban, reset, ekspor/impor, lempar dadu
src/charts.js       grafik SVG (PMF, konvergensi, batang aturan)
src/app.js          router hash, layar sampul/bagian/papan data, interaksi
src/laporan.js      codec kode laporan 7 karakter (Crockford base32 + CRC-8)
vendor/katex/       KaTeX 0.16.11 (js + css + font woff2, tanpa CDN)
rekap.html          alat pengembang: rekap kode kelas
tests/              uji codec (node tests/laporan.test.cjs)
docs/               mockup & tangkapan layar
```

## Aturan produk

- **Tanpa login.** Progres dan jawaban di `localStorage`; identitas hanya label.
- **Discovery dulu, nama konsep kemudian.** Rumus akhir tidak boleh muncul di teks soal;
  definisi tinggal di panel Materi yang terkunci sampai butir bagian itu terjawab.
- **Tanpa skor/leaderboard.** Penilaian dilakukan manual oleh dosen.
- **Kode laporan** `XXXX-EFG` per bagian: disalin sebagai pelengkap, direkap di `rekap.html`.
- **Navigasi**: Sampul → Bagian A–E → Papan Data; URL ber-hash (`#/misi/3`) supaya tombol back wajar.
- **Reset** hanya di sampul, dua pilihan: hapus progres (identitas tetap) atau hapus semua.
- **Data mentah** (nilai dadu tiap lemparan) yang disimpan, bukan agregat.

## Aksesibilitas & responsif

- Tidak ada teks di bawah 11,5 px; teks isi 13,5–14 px.
- Target sentuh ≥ 44 px; input 16 px supaya Safari iOS tidak memperbesar halaman.
- Kontras teks ≥ 6:1; status memakai ikon + warna (aman buta warna).
- `prefers-reduced-motion` mematikan animasi dadu.
- < 768 px satu kolom; ≥ 1024 px dua kolom (instrumen kiri, data kanan), maksimum 1180 px.

## Deploy (Cloudflare Pages, statis)

1. Push folder ini ke repo GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Framework: **None**, build command kosong, output directory `/`.
4. Hasil: `https://<nama>.pages.dev` · alat pengembang di `/rekap.html`.
