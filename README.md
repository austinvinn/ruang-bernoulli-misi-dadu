# Ruang Bernoulli: Misi Dadu

Media pembelajaran **Distribusi Bernoulli** untuk mahasiswa statistika matematika.
Satu alat peraga (dadu), lima misi, lima bagian LKPD. Light mode, tanpa backend.

## Status

| Bagian | Status |
|---|---|
| Beranda (identitas opsional, peta 5 misi, lanjutkan, reset, unduh/pulihkan progres) | ✅ jalan |
| Misi 1 — variabel indikator (5 lemparan) | ✅ jalan |
| Misi 2 — frekuensi & proporsi (10 lemparan + tabel p̂) | ✅ jalan |
| Misi 3 — konvergensi & LLN (tebak dulu → 100 lemparan + grafik) | ✅ jalan |
| Misi 4 — parameter p (3 aturan × 60 lemparan) | ✅ jalan (MLE di LKPD) |
| Misi 5 — estimasi gabungan (Σk/Σn vs rata-rata p̂ + SE) | ✅ jalan |
| Papan Data (PMF, konvergensi, tabel, kode laporan) | ✅ jalan |
| Alat pengembang `rekap.html` (tempel kode → tabel + CSV) | ✅ jalan |
| Deploy | ✅ https://misi-dadu.pages.dev |
| Dokumen serah terima LKPD | ✅ `docs/handover-lkpd.tex` |

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
index.html        kerangka + CSS (palet sage)
src/store.js      progres, status misi, reset, ekspor/impor, lempar dadu
src/charts.js     grafik SVG (PMF, konvergensi, batang aturan)
src/app.js        router hash, 3 layar, interaksi
src/laporan.js    codec kode laporan 7 karakter (Crockford base32 + CRC-8)
rekap.html        alat pengembang: rekap kode kelas
tests/            uji codec (node tests/laporan.test.cjs)
docs/             mockup & tangkapan layar
```

## Aturan produk

- **Tanpa login.** Progres di `localStorage`; identitas hanya label.
- **Tanpa skor/leaderboard.** Progres = misi terbuka + laporan.
- **Kode laporan** `XXXX-EFG` per misi: disalin ke LKPD, direkap di `rekap.html`.
- **Navigasi**: Arena/Papan Data → panah kembali ke satu level atas; Beranda tanpa panah.
  URL ber-hash (`#/misi/3`) supaya tombol back HP wajar.
- **Reset** hanya di Beranda, dua pilihan: hapus progres (identitas tetap) atau hapus semua.
- **Data mentah** (nilai dadu tiap lemparan) yang disimpan, bukan agregat.

## Aksesibilitas & responsif

- Kontras teks ≥ 6:1; status memakai ikon + warna (aman buta warna).
- Target sentuh ≥ 42 px; `prefers-reduced-motion` mematikan animasi dadu.
- < 768 px satu kolom; ≥ 1024 px dua kolom (instrumen kiri, data kanan), maksimum 1180 px.

## Deploy (Cloudflare Pages, statis)

1. Push folder ini ke repo GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Framework: **None**, build command kosong, output directory `/`.
4. Hasil: `https://<nama>.pages.dev` · alat pengembang di `/rekap.html`.
