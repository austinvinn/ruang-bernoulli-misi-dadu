# Design file — Ruang Bernoulli: Misi Dadu

Berkas kerja desain FigCraft untuk revisi tampilan situs.

| Berkas | Isi |
| --- | --- |
| `Ruang Bernoulli - Misi Dadu.figcraft` | Berkas kerja utama (buka di aplikasi FigCraft) |
| `Ruang Bernoulli - Misi Dadu.fig` | Ekspor `.fig` (eksperimental, untuk portabilitas) |
| `page-01-layar-aplikasi.png` | Render halaman 01 |
| `page-02-desktop-referensi.png` | Render halaman 02 |
| `page-03-papan-revisi.png` | Render halaman 03 |

## Struktur halaman

1. **01 - Layar Aplikasi** — 10 layar mobile 390×844 (Beranda, Arena, Papan Data, Misi 5, popup, toast, simulasi kelas).
2. **02 - Desktop dan Referensi** — tangkapan desktop dan mockup (laptop, kredit, mockup v2 desktop/HP, mockup kontrol Misi 5).
3. **03 - Papan Revisi** — papan tiga kolom (Belum / Sedang / Selesai) untuk mencatat keputusan revisi.

## Alur revisi

1. Ubah bingkai layar di halaman 01 atau 02.
2. Catat satu kartu per revisi di halaman 03.
3. Terapkan perubahan ke kode di `src/` dan `index.html`.
4. Perbarui tangkapan layar di `docs/` setelah revisi selesai, lalu render ulang berkas desain.

## Asal gambar

Semua gambar di halaman 01 dan 02 berasal dari `docs/*.png` (tangkapan aplikasi versi terakhir). Bingkai adalah wadah gambar tersebut; bukan komponen FigCraft.
