# Arsitektur — Misi Dadu (Website Pembelajaran Distribusi Bernoulli)

Catatan keputusan teknis (ADR ringkas). Diperbarui: 24 Oktober 2026.

## Konteks

| Fakta | Nilai |
|---|---|
| Pengguna | ± 20 mahasiswa, masing-masing 1 HP |
| Intensitas | 5 sesi × ± 100 lemparan (± 500 lemparan/orang) |
| Peran | **pengembang** (pemilik website) dan **user** (mahasiswa). Tidak ada peran dosen. |
| Domain | belum ada → `*.pages.dev` |
| Pembagian kerja | Website = alat eksperimen & data. LKPD (tim lain) = teori, tabel, kesimpulan. |

## Keputusan

**Hosting statis di Cloudflare Pages. Tanpa backend, tanpa database, tanpa login.**

### Alasan
1. Skala 20 pengguna tidak membenarkan kompleksitas backend (Workers + D1 + auth + email OTP).
2. Game harus tetap jalan saat wifi kelas buruk → aset statis + `localStorage` membuatnya offline-capable.
3. Pengembang tetap dapat **rekap kelas** tanpa server lewat `rekap.html` + kode laporan.
4. `*.pages.dev` gratis, URL stabil, dan **menambah backend di kemudian hari tidak mengubah URL**.

### Kuota yang relevan (diverifikasi 24 Okt 2026)
- Cloudflare Pages free: 500 build/bulan, **request aset statis tak terbatas**, 20.000 file, 25 MiB/file.
- Pages Functions (jika nanti dipakai): 100.000 request/hari, 10 ms CPU/invocation.
- D1 (jika nanti dipakai): 5 juta row read/hari, 100.000 row write/hari; **sejak 1 Sep 2026 query gagal** bila batas harian terlampaui (data tetap aman).
- GitHub Pages: 1 GB/site, 100 GB/bulan (soft), 10 build/jam — tidak dipakai sebagai host utama, hanya sebagai repo.

## Kode laporan (pengganti backend)

7 karakter Crockford base32, contoh `P8S0-48T`.

| Field | Bit | Catatan |
|---|---|---|
| versi | 2 | selalu 1 |
| misi | 3 | 1–7 |
| aturan | 3 | jumlah sisi dadu yang dihitung sukses (0–7); 0 = tidak dipakai |
| n | 10 | 0–1023 |
| k | 10 | 0–n |
| checksum | 8 | CRC-8 polinomial 0x07 |

Total 36 bit, bit tertinggi selalu 0 → 7 karakter. Toleransi tulis tangan: huruf kecil, spasi,
prefix `MD6-`, `O`→0, `I`/`L`→1, `U`→0. Salah ketik 1 karakter **selalu ditolak** (diuji 217 varian).

Aturan penting: penggabungan data kelas memakai **Σk/Σn**, bukan rata-rata p̂ (berbeda bila n tidak seragam).

## Struktur file

```
index.html          # game 5 misi (Fase 1–2)
rekap.html          # alat pengembang: tempel kode -> tabel + histogram p̂ + CSV
src/laporan.js      # codec kode laporan (dipakai index.html dan rekap.html)
src/store.js        # adapter penyimpanan: lokal (localStorage) / awan (nanti)
tests/laporan.test.cjs
```

## Jalur peningkatan (kalau skala berubah)

Tambah `functions/api/*.js` + D1, isi `src/store.js` implementasi `awan`, dashboard
`/pengembang` dilindungi Cloudflare Access (gratis ≤ 50 user, perlu custom domain agar mulus).
URL, format kode laporan, dan seluruh LKPD **tidak berubah**.

## Deploy (Cloudflare Pages, static)

1. Repo GitHub berisi file di atas.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Framework preset: **None**. Build command: kosong. Build output directory: `/`.
4. Deploy → `https://<nama>.pages.dev`.
5. Halaman pengembang: `https://<nama>.pages.dev/rekap.html` (boleh dibuka siapa saja —
   tidak ada data tersimpan di server; semua perhitungan di browser).
