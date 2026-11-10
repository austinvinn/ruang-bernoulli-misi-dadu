/* =========================================================
   lkm-data.js — isi Lembar Kerja Mahasiswa (LKM) digital
   Lima bagian (A–E), satu percobaan = satu lemparan.
   Aturan penulisan butir (audit P32 + revisi OTO 2026-11-10):
     - soal maksimal dua kalimat, sasaran ≤ 25 kata
     - tugas ganda ditulis (1) (2) (3) sebagai langkah bernomor
     - petunjuk ≤ 15 kata, hanya format jawaban / rujukan,
       TIDAK memuat nilai jawabannya (discovery harus tetap jalan)
     - istilah "Bagian A–E" dipakai seragam (bukan "Misi A")
     - istilah teknis hanya di kartu materi, bukan di soal
   Penulisan rumus: $...$ inline (pakai \frac), $$...$$ blok
   (boleh \dfrac, tampil lebih besar). Runtime memakai satu
   backslash (KaTeX menerima langsung).
   ========================================================= */
(function (root) {
  "use strict";

  var DATA = [
    {
      kode: "A", misi: 1,
      judul: "Satu lemparan, satu aturan",
      ringkas: "1 dadu · 1 lemparan",
      tujuan: "Melempar satu dadu dengan aturan tetap dan mencatat hasilnya sebagai sukses atau gagal.",
      tp: "TP1 — mengelompokkan hasil satu percobaan menjadi dua hasil (sukses/gagal) dan menyatakannya sebagai $X=1$ atau $X=0$.",
      aturan: "tetap: muncul angka 6",
      butir: [
        {
          id: "A1", tipe: "teks", fase: "pra",
          soal: "Sebelum melempar: angka apa saja yang mungkin muncul pada satu dadu? Tulis keenamnya, dipisah koma.",
          petunjuk: "Tulis angka yang tercetak di sisi dadu."
        },
        {
          id: "A2", tipe: "teks",
          soal: "Setelah dilempar: (1) angka berapa yang muncul? (2) Masuk **muncul 6** atau **bukan 6**?",
          petunjuk: "Angka hasil lemparan ada di kotak dadu di atas."
        },
        {
          id: "A3", tipe: "teks",
          soal: "Sekarang hasil dibagi dua kelompok: **muncul 6** dan **bukan 6**. (1) Ada berapa hasil? (2) Sebutkan keduanya, tandai yang sukses.",
          petunjuk: "Jawab berurutan: jumlah hasil, lalu dua hasil."
        },
        {
          id: "A4", tipe: "teks",
          soal: "Hitung peluang sukses dan peluang gagal dari **banyaknya sisi**, bukan dari hasil lemparanmu. Tulis dua pecahan.",
          petunjuk: "Pembilang = sisi yang masuk kelompok, penyebut = 6."
        },
        {
          id: "A5", tipe: "teks",
          soal: "Sukses ditulis $X=1$, gagal $X=0$. Hasil lemparanmu bernilai $X$ berapa? Beri satu alasan singkat.",
          petunjuk: "Satu angka, lalu satu alasan."
        }
      ],
      materi: {
        judul: "Materi A — Percobaan Bernoulli dan peubah indikator",
        isi: [
          "**Percobaan Bernoulli** adalah percobaan yang hasilnya dapat dikelompokkan menjadi tepat dua hasil: **sukses** dan **gagal**. Dadu bersisi enam baru menjadi Bernoulli setelah hasilnya dipetakan ke \u201cmuncul 6\u201d dan \u201cbukan 6\u201d.",
          "Ruang hasil dadu $\\Omega=\\{1,2,3,4,5,6\\}$. Untuk $A=\\{6\\}$ diperoleh $|A|=1$ dan $|\\Omega|=6$, sehingga $$p=\\dfrac{|A|}{|\\Omega|}=\\dfrac{1}{6}.$$",
          "Hasil percobaan dipetakan ke angka lewat **peubah indikator** $X$: $X=1$ bila sukses, $X=0$ bila gagal. Jadi $P(X=1)=p$ dan $P(X=0)=1-p$.",
          "Satu percobaan = satu kali menjalankan aturan: satu lemparan dadu di Bagian A, satu lemparan dua dadu di Bagian C. Peluang dihitung dari banyaknya sisi, **bukan** dari hasil lemparanmu: satu lemparan tidak bisa membuktikan peluang $\\frac{1}{6}$."
        ]
      }
    },

    {
      kode: "B", misi: 2,
      judul: "Pilih aturanmu sendiri",
      ringkas: "1 dadu · aturan pilihanmu",
      tujuan: "Mengganti aturan sukses, menghitung peluang baru, lalu memeriksa apa yang berubah.",
      tp: "TP2 — menentukan peluang sukses $p$ dari aturan yang kamu pilih ($p=|A|/6$) dan membandingkannya dengan aturan lain.",
      aturan: "pilih: ganjil / genap / muncul 5 atau lebih / muncul 2 atau kurang",
      butir: [
        {
          id: "B1", tipe: "teks", fase: "pra",
          soal: "Sebelum melempar: tebak peluang sukses aturanmu di panel aturan. Tulis pecahan atau desimal.",
          petunjuk: "Contoh bentuk jawaban: 3/6 atau 0,500."
        },
        {
          id: "B2", tipe: "teks", fase: "pra",
          soal: "Berapa sisi dadu yang masuk aturanmu? (1) Tulis banyaknya sisi. (2) Hitung $p=\\frac{\\text{banyak sisi}}{6}$.",
          petunjuk: "Bandingkan hasil hitung dengan tebakan B1."
        },
        {
          id: "B3", tipe: "teks",
          soal: "Lempar sekali: (1) angka berapa yang muncul? (2) S atau G menurut aturanmu?",
          petunjuk: "S = masuk aturanmu, G = tidak masuk."
        },
        {
          id: "B4", tipe: "teks",
          soal: "Ganti aturanmu ke aturan lain, lalu lempar lagi. (1) Apa yang berubah? (2) Apa yang tetap?",
          petunjuk: "Bandingkan banyak hasil dan besar peluang."
        }
      ],
      materi: {
        judul: "Materi B — Aturan menentukan |A|, bukan bentuk percobaan",
        isi: [
          "Aturan sukses hanya memilih sebagian anggota ruang hasil: $A\\subseteq\\Omega$. Peluang suksesnya selalu $$p=\\dfrac{|A|}{|\\Omega|}.$$",
          "Untuk satu dadu, $|\\Omega|=6$. Aturan \u201cangka genap\u201d memberi $|A|=3$, sehingga $$p=\\dfrac{3}{6}=0{,}5,$$ sedangkan \u201cmuncul 5 atau lebih\u201d memberi $|A|=2$, sehingga $$p=\\dfrac{2}{6}\\approx 0{,}333.$$",
          "Mengganti aturan **tidak** mengubah bentuk percobaan: tetap dua hasil, sukses dan gagal. Yang berubah hanya $p$, dan peluang gagal selalu $1-p$."
        ]
      }
    },

    {
      kode: "C", misi: 3,
      judul: "Dua dadu, satu aturan",
      ringkas: "2 dadu · 1 lemparan",
      tujuan: "Menetapkan aturan pada dua dadu, menghitung peluangnya, lalu memeriksa apakah percobaannya masih Bernoulli.",
      tp: "TP3 — menghitung $p$ untuk kejadian gabungan (dua dadu, 36 titik sampel) dan memeriksa apakah percobaannya masih Bernoulli.",
      aturan: "pilih: jumlah genap / jumlah ganjil / jumlah = 7",
      butir: [
        {
          id: "C1", tipe: "teks", fase: "pra",
          soal: "Sebelum melempar: tebak peluang sukses aturan dua dadu pilihanmu. Tulis pecahan atau desimal.",
          petunjuk: "Dua dadu dilempar sekali; hasilnya satu pasangan angka."
        },
        {
          id: "C2", tipe: "teks", fase: "pra",
          soal: "Berapa pasangan dua dadu yang masuk aturanmu? (1) Tulis cara menghitung atau daftarnya. (2) Tulis $p$ sebagai pecahan.",
          petunjuk: "Susun pasangan menurut dadu pertama supaya tidak terlewat."
        },
        {
          id: "C3", tipe: "teks",
          soal: "Lempar dua dadu sekali. Catat: (1) dadu pertama, (2) dadu kedua, (3) jumlah, (4) S atau G.",
          petunjuk: "Jumlah = dadu pertama + dadu kedua."
        },
        {
          id: "C4", tipe: "teks",
          soal: "Di sini dipakai dua dadu. Apakah percobaannya masih Bernoulli? Jawab ya/tidak, lalu beri satu alasan.",
          petunjuk: "Rujuk ciri Bernoulli di Materi Bagian A."
        }
      ],
      materi: {
        judul: "Materi C — Kejadian gabungan pada ruang 36 titik sampel",
        isi: [
          "Melempar dua dadu sekali menghasilkan pasangan berurutan $(a,b)$: $a$ = dadu pertama, $b$ = dadu kedua. Karena urutan diperhatikan, ruang hasilnya berisi $6\\times 6=36$ titik sampel.",
          "Aturan \u201cjumlah genap\u201d memasukkan 18 pasangan, sehingga $$p=\\dfrac{18}{36}=\\dfrac{1}{2}.$$ Aturan \u201cjumlah = 7\u201d memasukkan 6 pasangan, sehingga $$p=\\dfrac{6}{36}=\\dfrac{1}{6}.$$",
          "Setelah aturan ditetapkan, hasil percobaan hanya dua: **masuk aturan** (S) atau **tidak masuk aturan** (G). Karena itu percobaannya tetap Bernoulli, dengan $p=|A|/36$.",
          "Dibanding Bagian A, ruang hasil membesar dari 6 menjadi 36 dan $|A|$ ikut berubah, tetapi bentuk percobaannya sama: satu percobaan, dua hasil, satu peluang sukses."
        ]
      }
    },

    {
      kode: "D", misi: 4,
      judul: "Menyusun rumus peluangnya",
      ringkas: "tanpa lemparan baru",
      tujuan: "Menyusun tabel sebaran $X$ dari data Bagian A, lalu menemukan bentuk yang berlaku untuk kedua nilainya.",
      tp: "TP4 — menyusun tabel sebaran $X$ dan menemukan bentuk $P(X=x)=p^{x}(1-p)^{1-x}$ untuk $x=0,1$, lalu menamainya distribusi Bernoulli.",
      aturan: "memakai hasil Bagian A (p = 1/6)",
      butir: [
        {
          id: "D1", tipe: "tabel",
          soal: "Isi tabel sebaran $X$ untuk percobaan Bagian A (aturan: muncul angka 6).",
          kolom: ["$x$", "$P(X = x)$"],
          baris: [["0"], ["1"]],
          petunjuk: "Pakai peluang gagal (x=0) dan sukses (x=1) dari A4."
        },
        {
          id: "D2", tipe: "teks",
          soal: "Uji bentuk $p^{x}(1-p)^{1-x}$ dengan $p=\\frac{1}{6}$ untuk $x=0$ dan $x=1$. Bandingkan hasilnya dengan tabel D1.",
          petunjuk: "Untuk x=1 pangkat 1−x = 0, dan $a^{0}=1$."
        },
        {
          id: "D3", tipe: "teks",
          soal: "Bentuk itu disebut **distribusi Bernoulli**: $X\\sim\\mathrm{Bernoulli}(p)$. Ganti $p$ dengan peluang sukses aturanmu di Bagian B: (1) hitung $P(X=1)$ dan $P(X=0)$; (2) sebutkan apa yang berubah dan apa yang tetap.",
          petunjuk: "Bandingkan hasil hitungmu dengan baris D1."
        }
      ],
      materi: {
        judul: "Materi D — Sebaran dan rumus distribusi Bernoulli",
        isi: [
          "Sebaran $X$ hanya berisi dua baris: $x=0$ dengan peluang $1-p$, dan $x=1$ dengan peluang $p$. Tabel inilah **tabel distribusi** peubah Bernoulli.",
          "Kedua baris dapat ditulis dengan satu rumus: $$P(X=x)=p^{x}(1-p)^{1-x},\\qquad x\\in\\{0,1\\}.$$ Untuk $x=1$ hasilnya $p$; untuk $x=0$ hasilnya $1-p$.",
          "Rumus itu tidak bergantung pada dadu: mengganti aturan hanya mengganti $p$.",
          "**Pengayaan (tidak dinilai).** Dari tabel itu diperoleh $\\mathbb{E}[X]=p$ dan $\\operatorname{Var}(X)=p(1-p)$. Ragam terbesar ada di $p=0{,}5$ karena hasilnya paling tidak pasti."
        ]
      }
    },

    {
      kode: "E", misi: 5,
      judul: "Rancang sendiri, lalu simpulkan",
      ringkas: "1 dadu · aturan buatanmu",
      tujuan: "Merancang percobaan Bernoulli sendiri, memprediksi peluangnya, lalu menyimpulkan ciri dan rumusnya.",
      tp: "TP5 — merancang percobaan Bernoulli sendiri, memprediksi $p$, menguji dengan satu lemparan, lalu menyimpulkan definisi dan syaratnya.",
      aturan: "bebas: kamu yang menyusun aturan sukses",
      butir: [
        {
          id: "E1", tipe: "teks", fase: "pra",
          soal: "Tulis aturan suksesmu: sisi mana yang sukses dan sisi mana yang gagal?",
          petunjuk: "Contoh: \u201cSukses kalau muncul angka lebih dari 4.\u201d"
        },
        {
          id: "E2", tipe: "teks", fase: "pra",
          soal: "Sebelum melempar: berapa peluang sukses aturanmu? Hitung dari banyaknya sisi.",
          petunjuk: "Tulis pecahan atau desimal, misalnya 2/6 = 0,333."
        },
        {
          id: "E3", tipe: "teks",
          soal: "Lempar sekali: (1) angka berapa, S atau G? (2) Cukupkah satu lemparan untuk membuktikan peluang di E2? Satu kalimat.",
          petunjuk: "Satu lemparan hanya memberi satu hasil."
        },
        {
          id: "E4", tipe: "teks",
          soal: "Simpulkan tiga hal, satu kalimat tiap nomor: (1) ciri percobaan Bernoulli; (2) rumus $P(X=x)$ untuk $x=0$ dan $x=1$; (3) mengapa satu percobaan cukup di sini.",
          petunjuk: "Tulis tiga baris, satu baris untuk tiap nomor."
        }
      ],
      materi: {
        judul: "Materi E — Rangkuman percobaan Bernoulli",
        isi: [
          "Percobaan Bernoulli punya dua ciri: (1) hasilnya dapat dikelompokkan menjadi tepat dua hasil yang saling lepas, (2) peluang suksesnya $p$ dengan $0<p<1$, sehingga peluang gagal $1-p$.",
          "Peubah indikatornya $X\\in\\{0,1\\}$ dengan $P(X=1)=p$ dan $P(X=0)=1-p$, yang dapat ditulis $P(X=x)=p^{x}(1-p)^{1-x}$.",
          "Aturan bebas tetap harus membagi ruang hasil menjadi tepat dua kelompok dengan $0<p<1$. Aturan \u201cangka berapa saja\u201d memberi $p=1$ sehingga bukan Bernoulli.",
          "**Catatan.** Kalau percobaan Bernoulli diulang $n$ kali dan **jumlah** suksesnya dihitung, peubahnya berganti menjadi Binomial. Itu materi berikutnya; di sini fokusnya satu percobaan (Bernoulli)."
        ]
      }
    }
  ];

  root.LKM_DATA = DATA;
})(typeof globalThis !== "undefined" ? globalThis : this);
