/* =========================================================
   lkm-data.js — isi Lembar Kerja Mahasiswa (LKM) digital
   Lima bagian (A–E), satu percobaan = satu lemparan.
   Pola discovery: satu prediksi di awal → percobaan → refleksi di
   akhir → materi terbuka. Jangan menaruh rumus akhir di dalam soal
   sebelum bagian D.
   Penulisan rumus: $...$ untuk inline, $$...$$ untuk blok.
   ========================================================= */
(function (root) {
  "use strict";

  var DATA = [
    {
      kode: "A", misi: 1,
      judul: "Satu lemparan, dua hasil",
      ringkas: "1 dadu · 1 lemparan",
      tujuan: "Mengubah hasil satu lemparan dadu menjadi dua hasil saja, lalu memetakannya ke angka 1 dan 0.",
      tp: "TP1 — membedakan percobaan Bernoulli dari percobaan biasa: satu percobaan hanya punya dua hasil dan hasilnya dipetakan ke X = 1 (sukses) atau X = 0 (gagal).",
      aturan: "tetap: muncul angka 6",
      butir: [
        {
          id: "A1", tipe: "teks", fase: "pra",
          soal: "Sebelum melempar: hasil apa saja yang **mungkin muncul** dari satu dadu bersisi enam? Tulis semuanya.",
          petunjuk: "Tidak ada tebakan yang salah di sini. Yang penting kamu sadar bahwa hasil yang mungkin cuma beberapa angka. Butir ini harus terisi sebelum tombol lempar terbuka."
        },
        {
          id: "A2", tipe: "teks",
          soal: "Lemparanmu menghasilkan angka berapa? Angka itu termasuk kelompok **muncul 6** atau kelompok **bukan 6**?",
          petunjuk: "Lihat kotak dadu di atas — angka terakhir yang muncul tertulis di sana."
        },
        {
          id: "A3", tipe: "teks",
          soal: "Kalau kelompok **muncul 6** kamu sebut **sukses**, ada berapa hasil yang mungkin pada percobaan ini? Sebutkan keduanya, lalu tentukan mana yang sukses.",
          petunjuk: "Percobaan ini hanya boleh punya dua hasil. Kelompokkan semua angka dadu menjadi dua bagian."
        },
        {
          id: "A4", tipe: "teks",
          soal: "Hitung peluang sukses dan peluang gagal memakai **banyaknya sisi dadu** (bukan hasil lemparanmu). Tulis sebagai pecahan.",
          petunjuk: "Contoh bentuk jawaban: peluang sukses 1/6, peluang gagal 5/6. Jumlah keduanya harus 1."
        },
        {
          id: "A5", tipe: "teks",
          soal: "Tulis nilai $X$ untuk hasil lemparanmu tadi (0 atau 1), lalu jelaskan dalam satu kalimat mengapa kamu memilih angka itu.",
          petunjuk: "$X = 1$ kalau hasilnya sukses, $X = 0$ kalau gagal."
        }
      ],
      materi: {
        judul: "Materi A — Percobaan Bernoulli dan peubah indikator",
        isi: [
          "**Percobaan Bernoulli** adalah percobaan yang hanya punya **dua hasil**: sukses dan gagal. Dadu bersisi enam sebenarnya punya enam hasil, tetapi setelah hasilnya dikelompokkan menjadi \u201cmuncul 6\u201d dan \u201cbukan 6\u201d, percobaannya menjadi dua hasil.",
          "Ruang hasil dadu $\\\\Omega=\\\\{1,2,3,4,5,6\\\\}$. Kalau $A=\\\\{6\\\\}$, maka $|A|=1$ dan $|\\\\Omega|=6$, sehingga $p=\\\\dfrac{|A|}{|\\\\Omega|}=\\\\dfrac{1}{6}$.",
          "Hasil percobaan dipetakan ke angka lewat **peubah indikator** $X$: $X=1$ bila sukses, $X=0$ bila gagal. Jadi $P(X=1)=p$ dan $P(X=0)=1-p$.",
          "Satu percobaan = satu lemparan. Peluang di sini dihitung dari banyaknya sisi, **bukan** dari hasil lemparanmu: satu lemparan tidak bisa membuktikan peluang 1/6."
        ]
      }
    },

    {
      kode: "B", misi: 2,
      judul: "Ganti aturan, ganti peluang",
      ringkas: "1 dadu · aturan pilihanmu",
      tujuan: "Melihat bahwa yang berubah ketika aturan diganti adalah peluangnya, bukan bentuk percobaannya.",
      tp: "TP2 — menentukan peluang sukses $p$ dari aturan yang kamu pilih ($p=|A|/6$) dan menunjukkan bahwa mengganti aturan mengubah $p$, bukan bentuk percobaannya.",
      aturan: "pilih: ganjil / genap / muncul 5 atau lebih / muncul 2 atau kurang",
      butir: [
        {
          id: "B1", tipe: "teks", fase: "pra",
          soal: "Tulis aturan sukses yang kamu pilih di panel aturan. Sebelum melempar, **tebak peluang suksesnya**.",
          petunjuk: "Tulis pecahan (misalnya 3/6) atau desimal (0,500). Tebakan tidak dinilai; yang dinilai adalah cara berpikirmu."
        },
        {
          id: "B2", tipe: "teks",
          soal: "Berapa banyak sisi dadu yang masuk aturanmu? Hitung $p = \\\\dfrac{\\\\text{banyak sisi itu}}{6}$, lalu bandingkan dengan tebakanmu.",
          petunjuk: "Contoh: aturan \u201cgenap\u201d memasukkan 2, 4, 6 sehingga p = 3/6 = 0,5."
        },
        {
          id: "B3", tipe: "teks",
          soal: "Lempar sekali. Hasilnya angka berapa, dan **S atau G** menurut aturanmu?",
          petunjuk: "S = sukses (masuk aturanmu), G = gagal. Hasilnya tertulis di kotak dadu."
        },
        {
          id: "B4", tipe: "teks",
          soal: "Kalau aturanmu diganti (misalnya dari ganjil ke genap), bagian mana yang **berubah** dan bagian mana yang **tetap**? Sebutkan keduanya.",
          petunjuk: "Perhatikan: banyaknya hasil percobaan tetap dua. Yang berubah hanya besar peluangnya."
        }
      ],
      materi: {
        judul: "Materi B — Aturan menentukan |A|, bukan bentuk percobaan",
        isi: [
          "Aturan sukses hanya memilih sebagian anggota ruang hasil: $A\\\\subseteq\\\\Omega$. Peluang sukses selalu $p=\\\\dfrac{|A|}{|\\\\Omega|}$.",
          "Untuk satu dadu, $|\\\\Omega|=6$. Aturan \u201cangka genap\u201d memberi $|A|=3$ sehingga $p=\\\\dfrac{3}{6}=0{,}5$; aturan \u201cmuncul 5 atau lebih\u201d memberi $|A|=2$ sehingga $p=\\\\dfrac{2}{6}\\\\approx 0{,}333$.",
          "Mengganti aturan **tidak** mengubah banyaknya hasil percobaan. Percobaannya tetap dua hasil (sukses/gagal); yang berubah hanya $p$.",
          "Peluang gagal selalu $1-p$. Untuk aturan apa pun pada satu dadu, $0<p<1$ selama $A$ bukan kosong dan bukan seluruh ruang hasil."
        ]
      }
    },

    {
      kode: "C", misi: 3,
      judul: "Dua dadu, tetap dua hasil",
      ringkas: "2 dadu · 1 lemparan",
      tujuan: "Menghitung peluang kejadian gabungan dari 36 titik sampel dan menunjukkan percobaannya tetap Bernoulli.",
      tp: "TP3 — menghitung $p$ untuk kejadian gabungan (dua dadu, 36 titik sampel) dan menunjukkan bahwa percobaan itu tetap Bernoulli.",
      aturan: "pilih: jumlah genap / jumlah ganjil / jumlah = 7",
      butir: [
        {
          id: "C1", tipe: "teks", fase: "pra",
          soal: "Tulis aturan dua dadu yang kamu pilih di panel aturan. Sebelum melempar, **tebak peluang suksesnya**.",
          petunjuk: "Dua dadu punya 36 kemungkinan pasangan. Tulis tebakanmu sebagai pecahan atau desimal."
        },
        {
          id: "C2", tipe: "teks",
          soal: "Berapa pasangan dua dadu yang masuk aturanmu? Hitung $p = \\\\dfrac{|A|}{36}$.",
          petunjuk: "Untuk aturan \u201cjumlah = 7\u201d, ada 6 pasangan: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1)."
        },
        {
          id: "C3", tipe: "teks",
          soal: "Lempar dua dadu sekali. Dadu pertama dan kedua berapa? Jumlahnya berapa? Hasilnya **S atau G**?",
          petunjuk: "Hasil kedua dadu tertulis di kotak dadu di atas."
        },
        {
          id: "C4", tipe: "teks",
          soal: "Percobaan ini memakai dua dadu, tetapi hasilnya tetap dua kelompok. Menurutmu mengapa percobaan ini **masih termasuk percobaan Bernoulli**?",
          petunjuk: "Yang menentukan bukan banyaknya dadu, melainkan banyaknya kelompok hasil setelah aturan ditetapkan."
        }
      ],
      materi: {
        judul: "Materi C — Kejadian gabungan pada ruang 36 titik sampel",
        isi: [
          "Melempar dua dadu sekali menghasilkan pasangan $(a,b)$ dengan $a,b\\\\in\\\\{1,\\\\dots,6\\\\}$. Ruang hasilnya berisi $6\\\\times 6=36$ titik sampel.",
          "Aturan \u201cjumlah genap\u201d memasukkan 18 pasangan sehingga $p=\\\\dfrac{18}{36}=\\\\dfrac{1}{2}$. Aturan \u201cjumlah = 7\u201d memasukkan 6 pasangan sehingga $p=\\\\dfrac{6}{36}=\\\\dfrac{1}{6}$.",
          "Setelah aturan ditetapkan, hasil percobaan hanya dua: **masuk aturan** (S) atau **tidak masuk aturan** (G). Karena itu percobaannya tetap Bernoulli, dengan $p=|A|/36$.",
          "Yang berubah dibanding Bagian A hanya besar ruang hasilnya (6 menjadi 36). Bentuk percobaannya sama: satu percobaan, dua hasil, satu peluang sukses."
        ]
      }
    },

    {
      kode: "D", misi: 4,
      judul: "Menemukan rumus peluangnya",
      ringkas: "tanpa lemparan baru",
      tujuan: "Menyusun tabel sebaran X dari data Misi A, lalu menemukan bentuk yang berlaku untuk kedua nilainya.",
      tp: "TP4 — menyusun tabel sebaran $X$ dan menemukan bentuk $P(X=x)=p^{x}(1-p)^{1-x}$ untuk $x=0,1$, lalu menamainya distribusi Bernoulli.",
      aturan: "memakai hasil Misi A (p = 1/6)",
      butir: [
        {
          id: "D1", tipe: "tabel",
          soal: "Isi tabel sebaran $X$ untuk percobaan Misi A (aturan: muncul angka 6). Kolom $P(X=x)$ diisi dari peluang sukses dan peluang gagal yang kamu hitung di Bagian A.",
          kolom: ["$x$", "$P(X = x)$"],
          baris: [["0"], ["1"]],
          petunjuk: "Tulis pecahan (5/6 dan 1/6) atau desimal tiga angka (0,833 dan 0,167). Jumlah kedua baris harus 1."
        },
        {
          id: "D2", tipe: "teks",
          soal: "Coba bentuk $p^{x}(1-p)^{1-x}$. Hitung bentuk itu untuk $x=0$ dan $x=1$ dengan $p=\\\\dfrac{1}{6}$, lalu bandingkan dengan baris tabelmu.",
          petunjuk: "Untuk $x=1$: $p^{1}(1-p)^{0}$. Untuk $x=0$: $p^{0}(1-p)^{1}$. Ingat $a^{0}=1$."
        },
        {
          id: "D3", tipe: "teks",
          soal: "Bentuk yang berlaku untuk kedua baris itu disebut **distribusi Bernoulli**, ditulis $X\\\\sim\\\\mathrm{Bernoulli}(p)$ dengan $P(X=x)=p^{x}(1-p)^{1-x}$. Sekarang ganti $p$ dengan hasil Misi B atau C: bagian mana yang berubah dan bagian mana yang tetap?",
          petunjuk: "Yang berubah hanya nilai $p$ (misalnya 1/2 pada aturan genap, atau 1/6 pada jumlah 7). Bentuk rumusnya tidak berubah."
        }
      ],
      materi: {
        judul: "Materi D — Sebaran dan rumus distribusi Bernoulli",
        isi: [
          "Sebaran $X$ hanya berisi dua baris: $x=0$ dengan peluang $1-p$, dan $x=1$ dengan peluang $p$. Tabel inilah **tabel distribusi** peubah Bernoulli.",
          "Kedua baris dapat ditulis dengan satu rumus: $$P(X=x)=p^{x}(1-p)^{1-x},\\\\qquad x\\\\in\\\\{0,1\\\\}.$$ Untuk $x=1$ hasilnya $p$; untuk $x=0$ hasilnya $1-p$.",
          "Rumus itu tidak bergantung pada dadu. Mengganti aturan hanya mengganti $p$; bentuk rumusnya tetap. Karena itu distribusi Bernoulli berlaku untuk semua percobaan dua hasil dengan peluang sukses $p$.",
          "**Pengayaan (tidak dinilai).** Dari tabel itu diperoleh $\\\\mathbb{E}[X]=p$ dan $\\\\operatorname{Var}(X)=p(1-p)$. Ragam terbesar ada di $p=0{,}5$ karena hasilnya paling tidak pasti."
        ]
      }
    },

    {
      kode: "E", misi: 5,
      judul: "Rancang sendiri, lalu simpulkan",
      ringkas: "1 dadu · aturan buatanmu",
      tujuan: "Merancang percobaan Bernoulli sendiri, memprediksi peluangnya, lalu menyimpulkan ciri dan rumusnya.",
      tp: "TP5 — merancang percobaan Bernoulli sendiri (aturan bebas), memprediksi $p$, menguji dengan satu lemparan, lalu menyimpulkan definisi dan syaratnya.",
      aturan: "bebas: kamu yang menyusun aturan sukses",
      butir: [
        {
          id: "E1", tipe: "teks", fase: "pra",
          soal: "Aturan sukses buatanmu sudah kamu pilih di panel aturan. Tulis aturannya dengan kata-katamu sendiri, lalu jelaskan **mengapa** kamu memilih aturan itu.",
          petunjuk: "Aturan harus membagi enam sisi dadu menjadi dua kelompok, dan kedua kelompok harus ada isinya (tidak boleh semua sisi masuk satu kelompok)."
        },
        {
          id: "E2", tipe: "teks", fase: "pra",
          soal: "Sebelum melempar: berapa peluang sukses aturanmu? Hitung dari banyaknya sisi, lalu tulis hasilnya.",
          petunjuk: "Tulis pecahan atau desimal, misalnya 2/6 = 0,333. Setelah E1 dan E2 terisi, tombol lempar terbuka."
        },
        {
          id: "E3", tipe: "teks",
          soal: "Lempar sekali. Hasilnya angka berapa, S atau G? Bandingkan hasil itu dengan peluang yang kamu hitung: apakah satu lemparan bisa membuktikan peluangmu?",
          petunjuk: "Satu lemparan hanya memberi satu hasil. Yang bisa kamu periksa adalah apakah hasil itu **mungkin** terjadi menurut aturanmu."
        },
        {
          id: "E4", tipe: "teks",
          soal: "Simpulkan: (1) ciri percobaan Bernoulli, (2) rumus peluangnya untuk $x=0$ dan $x=1$, (3) mengapa percobaan ini **satu lemparan saja**, bukan banyak lemparan yang hasilnya dijumlahkan.",
          petunjuk: "Tulis tiga bagian jawaban secara berurutan. Bagian (3) inti saran dosen: yang dikenalkan di sini adalah Bernoulli, bukan penjumlahan banyak percobaan."
        }
      ],
      materi: {
        judul: "Materi E — Rangkuman percobaan Bernoulli",
        isi: [
          "Percobaan Bernoulli punya tiga ciri: (1) hanya dua hasil yang mungkin, (2) peluang sukses $p$ tetap untuk percobaan itu, (3) satu percobaan berhenti pada satu hasil.",
          "Peubah indikatornya $X\\\\in\\\\{0,1\\\\}$ dengan $P(X=1)=p$ dan $P(X=0)=1-p$, yang dapat ditulis $P(X=x)=p^{x}(1-p)^{1-x}$.",
          "Aturan bebas tetap harus mempartisi ruang hasil menjadi tepat dua kelompok dengan $0<p<1$. Aturan \u201cangka berapa saja\u201d memberi $p=1$ sehingga bukan Bernoulli.",
          "**Catatan.** Kalau percobaan Bernoulli diulang $n$ kali dan **jumlah** suksesnya dihitung, peubahnya berganti menjadi Binomial. Itu materi berikutnya; di sini fokusnya satu percobaan (Bernoulli)."
        ]
      }
    }
  ];

  root.LKM_DATA = DATA;
})(typeof globalThis !== "undefined" ? globalThis : this);
