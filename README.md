# Ruang Bernoulli: Misi Dadu

**LKM digital** (lembar kerja mahasiswa) untuk topik **Distribusi Bernoulli**.
**Satu percobaan = satu lemparan** (satu atau dua dadu), lima bagian lembar kerja, materi yang
terbuka setelah siswa menemukan sendiri konsepnya. Light mode, tanpa build, **backend kecil di
Cloudflare** (Pages Functions + D1) untuk mengumpulkan jawaban lewat kode akses.

**Tim pengembang — Kelompok 9, Statistika Matematika 2026**
1. Ahmad As Siddiq (06081282429062)
2. Annisa Putri S. (06081282429036)
3. Fathia Aiva (06081382429083)
4. Sherin Az Zahra (06081382429085)

Program Studi Pendidikan Matematika · Fakultas Keguruan dan Ilmu Pendidikan · Universitas Sriwijaya

## Status

| Bagian | Status |
|---|---|
| Sampul LKM (identitas, tujuan TP1–TP5, petunjuk umum) | ✅ jalan |
| Bagian A (TP1) — satu lemparan, dua hasil, peubah indikator | ✅ jalan |
| Bagian B (TP2) — siswa memilih aturan, p = |A|/6 | ✅ jalan |
| Bagian C (TP3) — dua dadu, 36 titik sampel, tetap Bernoulli | ✅ jalan |
| Bagian D (TP4) — tabel sebaran X → rumus p^x(1−p)^(1−x) | ✅ jalan |
| Bagian E (TP5) — aturan buatan siswa + kesimpulan | ✅ jalan |
| Lembar kerja per butir (teks/angka/tabel) + simpan otomatis | ✅ jalan |
| Panel **Materi** terkunci sampai semua butir bagian itu terjawab | ✅ jalan |
| Rumus KaTeX lokal (tanpa CDN) | ✅ jalan |
| Papan Data (aturan, |A|, |Ω|, p, hasil, kode laporan) | ✅ jalan |
| Gerbang kode akses (kode kelas / kode pengembang) | ✅ jalan |
| Pengumpulan jawaban ke D1 + outbox luring | ✅ jalan |
| Halaman pengembang `/rekap.html` (tabel, filter kelas, unduh CSV, kelola kode) | ✅ jalan |
| Ekspor ke Google Sheets (IMPORTDATA otomatis + opsi Apps Script) | ✅ jalan |
| Deploy | ✅ https://misi-dadu.pages.dev |

**Alamat:** aplikasi https://misi-dadu.pages.dev · rekap pengembang
https://misi-dadu.pages.dev/rekap.html · pembaca kode laporan lama
https://misi-dadu.pages.dev/rekap-kode.html

## Kode akses

- **Kode kelas** — mis. `DADU-9A-K7QM`. Membuka lembar kerja satu kelas; kelas dikunci oleh kode.
- **Kode pengembang** — `DEV-DADU-…`. Semua hak kelas + halaman rekap + kelola kode.
- **Kode baca** — `BACA-DADU-…`. Hanya membaca rekap/CSV (dipakai untuk feed Google Sheets);
  tidak bisa membuat kode kelas maupun kode baru.

Kode disimpan sebagai **hash SHA-256** di tabel `kode`; plaintext hanya tampil sekali saat dibuat.
Sesi = cookie `HttpOnly` berisi token HMAC (`SESI_SECRET`), berlaku 30 hari. Salah kode 30× dalam
15 menit per IP → `429`; hitungan direset begitu ada kode yang benar (satu kelas sering berbagi
satu IP NAT, jadi tidak boleh terkunci gara-gara salah ketik orang lain).

## Rekap & ekspor

- `/rekap.html` (kode pengembang): tabel jawaban semua peserta, filter kelas, **Unduh CSV**,
  kelola kode (buat/matikan), tombol sinkron ke Google Sheets. Dengan **kode baca** halaman yang
  sama hanya menampilkan rekap + Unduh CSV; panel buat kode, daftar kode, dan sinkron Sheets
  disembunyikan (dan `/api/kode` tetap menolak dengan `403`).
- `GET /api/rekap?format=csv&token=<kode baca>` — CSV satu baris per peserta, kolom A1–E4;
  `&bentuk=panjang` satu baris per jawaban; `&bom=0` untuk feed mesin (dipakai `IMPORTDATA`).
- Dorong instan: `docs/apps-script-sheet.gs` (Apps Script Web App) + secret `SHEET_URL`/`SHEET_TOKEN`.

## Endpoint (Cloudflare Pages Functions)

| Rute | Metode | Akses | Isi |
|---|---|---|---|
| `/api/masuk` | POST | publik | `{kode}` → cookie sesi |
| `/api/keluar` | POST | sesi | hapus cookie |
| `/api/saya` | GET | sesi | identitas + jawaban tersimpan (pemulihan antar perangkat) |
| `/api/jawaban` | GET/POST | sesi | ambil / simpan jawaban butir + percobaan (`lemparan`: deret 1–2 angka, aturan, x) |
| `/api/peserta` | POST | sesi | `{mode:"kosongkan"}` hapus jawaban + percobaan, peserta tetap (tombol "Mulai ulang") |
| `/api/peserta` | DELETE | sesi | hapus data sendiri (benar-benar dihapus di D1) |
| `/api/rekap` | GET | dev/baca | JSON atau CSV, filter `?kelas=` |
| `/api/kode` | GET/POST | dev | daftar, buat, matikan/aktifkan kode |
| `/api/sheet` | POST | dev | dorong rekap ke Apps Script Web App |

## Menjalankan lokal

```bash
# tanpa backend (gerbang kode otomatis dilewati di localhost)
python -m http.server 8811 --bind 127.0.0.1

# dengan backend + D1 lokal (butuh .dev.vars berisi SESI_SECRET)
npx wrangler d1 execute misi-dadu-db --local --file=schema.sql
npx wrangler pages dev . --port 8821 --ip 127.0.0.1
```

Jangan menjalankan `wrangler d1 execute --local` saat server dev hidup: dua proses menulis
berkas SQLite yang sama dan menyebabkan `SQLITE_IOERR`.

## Struktur

```
index.html          kerangka + CSS (palet sage)
src/lkm-data.js     isi soal & materi Bagian A–E (pola discovery)
src/lkm.js          render butir, simpan jawaban, buka materi, render KaTeX
src/store.js        progres, status bagian, jawaban, aturan sukses, satu lemparan, reset, ekspor/impor
src/auth.js         gerbang kode akses + sesi server (mode lokal kalau API tidak ada)
src/sinkron.js      outbox: kirim jawaban ke server, tahan saat luring
src/app.js          router hash, layar sampul/bagian/papan data, interaksi
src/laporan.js      codec kode laporan 7–8 karakter (Crockford base32 + CRC-8, versi 1 & 2)
vendor/katex/       KaTeX 0.16.11 (js + css + font woff2, tanpa CDN)
functions/api/*.js  Pages Functions: masuk, keluar, saya, jawaban, peserta, rekap, kode, sheet
schema.sql          skema D1 (kode, peserta, jawaban, lemparan, coba)
wrangler.toml       binding D1 + config Pages
rekap.html          halaman pengembang (rekap server, CSV, kelola kode)
rekap-kode.html     pembaca kode laporan 7 karakter (alat lama, tetap ada)
migrations/         ALTER TABLE untuk basis data yang sudah ada
tests/              codec + mesin aturan + rekap (node tests/*.test.cjs)
docs/               mockup, tangkapan layar, apps-script-sheet.gs
```

## Aturan produk

- **Tanpa akun.** Akses lewat kode; tidak ada email/password, tidak ada data ke pihak ketiga
  selain Cloudflare (hosting + D1).
- **Discovery dulu, nama konsep kemudian.** Rumus akhir tidak boleh muncul di teks soal;
  definisi tinggal di panel Materi yang terkunci sampai butir bagian itu terjawab.
- **Tanpa skor/leaderboard.** Penilaian manual dari rekap; situs hanya menyimpan jawaban.
- **Offline-first.** `localStorage` tetap sumber kebenaran; server hanya cermin. Jawaban yang
  belum terkirim masuk antrean outbox dan dikirim ulang saat online.
- **Hapus data sendiri.** Tombol `Hapus data saya` menghapus `localStorage` dan baris D1,
  dengan bukti jumlah baris yang terhapus.
- **Kode laporan** 8 karakter `XXXX-EFGH` per bagian (versi 2: misi, jumlah dadu, |A|, hasil x);
  kode lama 7 karakter masih bisa dibaca. Pembaca: `rekap-kode.html`.
- **Navigasi**: Sampul → Bagian A–E → Papan Data; URL ber-hash (`#/misi/3`) supaya tombol back wajar.
- **Reset** hanya di sampul, dua pilihan: hapus progres (identitas tetap) atau hapus semua.
- **Satu percobaan = satu lemparan.** Tombol lempar boleh ditekan lagi, tetapi hasil lama tidak
  dijumlahkan; peluang dihitung dari banyaknya sisi (|A|/|Ω|), bukan dari frekuensi.

## Aksesibilitas & responsif

- Tidak ada teks di bawah 11 px (di ponsel teks pendukung 11 px, teks isi 13,5–14 px).
- Target sentuh ≥ 44 px di desktop; di ponsel ≤ 520 px tombol utama 46 px, tombol kecil 38–40 px.
- Input 16 px supaya Safari iOS tidak memperbesar halaman.
- Kontras teks ≥ 6:1; status memakai ikon + warna (aman buta warna).
- `prefers-reduced-motion` mematikan animasi dadu.
- ≤ 520 px: header 53 px dan footer 84–129 px (sebelumnya 78 / 156 px), teks sub judul
  dipendekkan, supaya isi lembar kerja dapat ± 50 px ruang tambahan.
- Footer otomatis **ringkas** saat isi digulir: teks progres butir + status server disembunyikan,
  tersisa tombol aksi (3 tombol); gulir ke atas memunculkannya lagi.
- Tombol **Papan data** tiap bagian mati sampai percobaan bagian itu selesai (A 5 lemparan,
  B 10, C 100, D 3×60, E tiga baris data); URL langsung `#/misi/2/data` juga ditolak dengan
  catatan kunci. Alasannya: Papan Data memuat seluruh data + kode laporan.
- < 768 px satu kolom; ≥ 1024 px dua kolom (instrumen kiri, data kanan), maksimum 1180 px.

## Deploy (Cloudflare Pages + Functions + D1)

```bash
git push origin main
npx wrangler d1 execute misi-dadu-db --remote --file=schema.sql       # sekali / saat skema berubah
npx wrangler d1 execute misi-dadu-db --remote \
  --file=migrations/2026-11-05-lemparan-aturan.sql                     # v4: kolom aturan + x
npx wrangler pages secret put SESI_SECRET --project-name=misi-dadu     # sekali
npx wrangler pages deploy . --project-name=misi-dadu --commit-hash $(git rev-parse HEAD)
```

Kode akses tidak pernah ditulis di repo. Buat/rotasi lewat `/rekap.html` →
"Buat kode akses baru" (panel ini hanya muncul untuk sesi **kode pengembang**; kode baca dan kode
kelas tidak bisa membuat kode). Deploy statis ≠ commit: selalu cek URL produksi sesudah deploy.
