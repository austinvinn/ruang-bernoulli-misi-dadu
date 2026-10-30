/* =========================================================
   lkm-data.js — isi Lembar Kerja Mahasiswa (LKM) digital
   Bagian A–E mengikuti pola discovery: amati → data → pola →
   rumuskan sendiri → baru diberi nama. Jangan menaruh rumus akhir
   di dalam teks soal.
   Penulisan rumus: $...$ untuk inline, $$...$$ untuk blok.
   ========================================================= */
(function (root) {
  "use strict";

  var DATA = [
    {
      kode: "A", misi: 1,
      judul: "Mengubah dadu menjadi dua angka",
      ringkas: "lima lemparan · dua hasil",
      tujuan: "Mengubah hasil lemparan dadu menjadi dua angka saja, 1 dan 0, lalu menentukan peluang masing-masing.",
      butir: [
        {
          id: "A1", tipe: "angka", fase: "pra",
          soal: "Sebelum melempar apa pun: berapa kali kamu menduga angka 6 muncul dalam lima lemparan?",
          petunjuk: "Isi **satu bilangan bulat dari 0 sampai 5** (0, 1, 2, 3, 4, atau 5). Tidak ada jawaban yang salah di sini."
        },
        {
          id: "A2", tipe: "tabel", misi: 1,
          soal: "Lempar dadu lima kali dengan tombol **Lempar dadu**, lalu **tulis sendiri** angka yang muncul pada kolom **Angka dadu**. Kolom **S / G** terisi sendiri: **S** kalau angkanya 6 dan **G** kalau bukan 6.",
          kolom: ["Lemparan", "Angka dadu", "S / G"],
          baris: [[1], [2], [3], [4], [5]],
          auto: { kolom: 2, dari: 1, jenis: "sg", min: 1, max: 6 },
          petunjuk: "Angka setiap lemparan juga bisa kamu lihat di **Papan Data** (tombol di bawah layar). Tulis angka 1 sampai 6 — kolom S / G mengikuti sendiri, jadi kamu bisa melihat pola: hanya angka 6 yang menjadi S."
        },
        {
          id: "A3", tipe: "teks",
          soal: "Hitung dari tabelmu: berapa banyak S dan berapa banyak G? Bisakah satu lemparan menghasilkan S sekaligus G? Mengapa?"
        },
        {
          id: "A4", tipe: "teks",
          soal: "Sekarang ganti S dengan 1 dan G dengan 0. Tulis deret lima angkamu, urut dari lemparan pertama.",
          petunjuk: "Bentuk jawabannya seperti: 0 0 1 0 0"
        },
        {
          id: "A5", tipe: "teks",
          soal: "Deret 0 dan 1 seperti itu disebut percobaan Bernoulli. Untuk dadu ini, berapa peluang muncul 1 dan berapa peluang muncul 0? Tulis dalam pecahan.",
          petunjuk: "Kaitkan dengan banyaknya sisi dadu, bukan dengan hasil lemparanmu."
        }
      ],
      materi: {
        judul: "Materi A — Percobaan Bernoulli dan peubah indikator",
        isi: [
          "Percobaan Bernoulli adalah percobaan yang hanya punya **dua hasil**: sukses dan gagal. Syaratnya tiga: hasilnya hanya dua, peluang sukses $p$ sama pada setiap ulangan, dan ulangan yang satu tidak memengaruhi ulangan lain.",
          "Ruang hasil dadu bersisi enam adalah $\\Omega=\\{1,2,3,4,5,6\\}$. Kejadian sukses $A=\\{6\\}$ berisi satu anggota, jadi $p=\\dfrac{|A|}{|\\Omega|}=\\dfrac{1}{6}$.",
          "Supaya bisa dihitung, hasil percobaan dipetakan ke angka melalui **peubah indikator** $X$: $X(\\omega)=1$ bila $\\omega\\in A$, dan $X(\\omega)=0$ bila $\\omega\\notin A$.",
          "Karena $X$ hanya bernilai 0 dan 1, maka $P(X=1)=p=\\dfrac{1}{6}\\approx 0{,}167$ dan $P(X=0)=1-p=\\dfrac{5}{6}\\approx 0{,}833$.",
          "Deret lima angka pada jawabanmu adalah realisasi dari lima peubah Bernoulli yang saling bebas. Jumlah suksesnya, dibagi banyaknya lemparan, adalah $\\hat p$ — itulah yang kamu bangun di Bagian B."
        ]
      }
    },

    {
      kode: "B", misi: 2,
      judul: "Menghitung proporsi sukses sendiri",
      ringkas: "sepuluh lemparan · kolom buatanmu",
      tujuan: "Membuat sendiri kolom jumlah sukses dan kolom pembagiannya, lalu menyimpulkan angka yang didekati.",
      butir: [
        {
          id: "B1", tipe: "tabel",
          soal: "Lempar dadu sepuluh kali. Isi kolom $X_i$ (1 kalau muncul 6, 0 kalau tidak), kolom $k_i$ = jumlah sukses dari lemparan ke-1 sampai ke-$i$, dan kolom $k_i/i$ = hasil pembagiannya.",
          kolom: ["i", "Xᵢ", "kᵢ", "kᵢ ⁄ i"],
          baris: [["1"], ["2"], ["3"], ["4"], ["5"], ["6"], ["7"], ["8"], ["9"], ["10"]],
          petunjuk: "Semua angka dadu hasil lemparanmu ada di **Papan Data** (tombol di bawah layar) — urut dari lemparan ke-1 sampai ke-10. Buka halaman itu untuk mengisi kolom $X_i$."
        },
        {
          id: "B2", tipe: "teks",
          soal: "Lihat kolom $k_i/i$ dari atas ke bawah. Nilainya mendekati angka berapa? Bandingkan dengan peluang muncul angka 6."
        },
        {
          id: "B3", tipe: "teks",
          soal: "Kolom $k_i/i$ yang kamu buat itu bernama **statistik** $\\hat p$, sedangkan $\\dfrac{1}{6}$ adalah **parameter** $p$. Tulis $\\hat p$ akhirmu (pada $i=10$) dan selisihnya dengan $p$."
        }
      ],
      materi: {
        judul: "Materi B — Statistik p̂ dan parameter p",
        isi: [
          "$\\hat p=\\dfrac{k}{n}$ disebut **statistik** karena dihitung dari data. $p$ disebut **parameter** karena merupakan nilai sebenarnya yang biasanya tidak diketahui.",
          "$\\hat p$ juga disebut frekuensi relatif sukses. Nilainya berubah setiap kali percobaan diulang, tetapi pusat sebarannya adalah $p$, yaitu $\\mathbb{E}[\\hat p]=p$.",
          "Sebaran $\\hat p$ menyempit ketika $n$ membesar: $\\operatorname{Var}(\\hat p)=\\dfrac{p(1-p)}{n}$. Inilah sebabnya kolom $k_i/i$ milikmu makin dekat ke $\\dfrac{1}{6}$ ketika $i$ bertambah.",
          "$\\hat p$ bukan hasil akhir, melainkan dugaan. Bagian C menunjukkan seberapa jauh dugaan itu boleh menyimpang."
        ]
      }
    },

    {
      kode: "C", misi: 3,
      judul: "Seberapa jauh dugaan boleh menyimpang",
      ringkas: "seratus lemparan · grafik p̂",
      tujuan: "Melihat apa yang terjadi pada p̂ ketika jumlah lemparan bertambah, dan seberapa besar simpangan yang masih wajar.",
      butir: [
        {
          id: "C1", tipe: "angka", fase: "pra", gerbang: "prediksi",
          soal: "Tebak dulu sebelum melempar: berapa kali angka 6 muncul dari 100 lemparan?",
          petunjuk: "Isi **satu bilangan bulat dari 0 sampai 100**. Angka ini mengunci tebakanmu; setelah tersimpan, tombol Lempar 100× terbuka."
        },
        {
          id: "C2", tipe: "tabel",
          soal: "Setelah seratus lemparan selesai, salin nilai $\\hat p$ dari grafik ke tabel ini. Grafiknya menandai enam titik dengan **garis putus-putus** dan titik bulat pada n = 10, 20, 40, 60, 80, dan 100. Nilai $\\hat p$ di setiap titik itu tertulis di sebelah titiknya.",
          kolom: ["n", "p̂"],
          baris: [["10"], ["20"], ["40"], ["60"], ["80"], ["100"]],
          petunjuk: "Grafik ada di panel kanan (di ponsel: di bawah kotak dadu). Sumbu datar = $n$ (jumlah lemparan), sumbu tegak = $\\hat p$. Nilai pada enam titik itu juga muncul di Papan Data Bagian C."
        },
        {
          id: "C3", tipe: "teks",
          soal: "Apa yang terjadi pada $\\hat p$ ketika $n$ bertambah? Jelaskan dengan kata-katamu sendiri."
        },
        {
          id: "C4", tipe: "angka",
          soal: "Pada $n=100$, berapa jarak $\\hat p$ dengan $p=\\dfrac{1}{6}$? Tulis dengan tiga angka di belakang koma.",
          petunjuk: "Jarak = selisih yang selalu positif: $|\\hat p-p|$. **Contoh cara menulis:** kalau $\\hat p=0{,}200$ maka jaraknya $|0{,}200-0{,}167|=0{,}033$ — tulis **0,033** (pakai koma, tiga angka di belakang koma). Kalau hasilmu kurang dari 0,1, awali dengan nol, misalnya **0,041**."
        },
        {
          id: "C5", tipe: "teks",
          soal: "Jarak yang masih wajar kira-kira $2\\cdot\\mathrm{SE}$ dengan $\\mathrm{SE}=\\sqrt{\\dfrac{p(1-p)}{n}}$. Hitung $2\\cdot\\mathrm{SE}$ untuk $n=100$, lalu bandingkan dengan jarak pada jawaban sebelumnya."
        }
      ],
      materi: {
        judul: "Materi C — Hukum bilangan besar dan galat baku",
        isi: [
          "**Hukum bilangan besar** (law of large numbers): untuk $n\\to\\infty$, $\\hat p\\to p$. Artinya bukan selalu tepat, tetapi peluang menyimpang jauh makin kecil.",
          "Simpangan baku $\\hat p$ disebut **galat baku** (standard error): $\\mathrm{SE}(\\hat p)=\\sqrt{\\dfrac{p(1-p)}{n}}$.",
          "Untuk $p=\\dfrac{1}{6}$ dan $n=100$ diperoleh $\\mathrm{SE}\\approx 0{,}0373$ sehingga $2\\,\\mathrm{SE}\\approx 0{,}0745$. Jarak di luar $2\\,\\mathrm{SE}$ jarang terjadi, tetapi tetap mungkin.",
          "Perhatikan letak $n$ di dalam rumus: menggandakan jumlah lemparan tidak menggandakan ketelitian. Ketelitian naik sebanding $\\sqrt{n}$, sehingga untuk setengah galat baku perlu empat kali lemparan."
        ]
      }
    },

    {
      kode: "D", misi: 4,
      judul: "Mencari nilai p yang paling masuk akal",
      ringkas: "tiga aturan · 180 lemparan",
      tujuan: "Menemukan sendiri nilai p yang paling masuk akal untuk data yang sudah dikumpulkan.",
      butir: [
        {
          id: "D1", tipe: "tabel",
          soal: "Lempar 60 kali untuk masing-masing aturan sukses (6 saja, ≥ 5, ≥ 4) memakai tombol di panel atas. Setelah ketiga aturan penuh, isi kolom $p$ dan $\\mathbb{E}[X]$ pada tabel ini — satu baris untuk satu aturan.",
          kolom: ["Aturan sukses", "|A|", "p", "E[X]"],
          baris: [["6 saja", "1"], ["≥ 5", "2"], ["≥ 4", "3"]],
          petunjuk: "**Cara mengisi.** $|A|$ = banyaknya sisi dadu yang dihitung sukses (sudah diisi: 1, 2, 3 dari enam sisi). $p$ = peluang sukses aturan itu, tulis sebagai desimal tiga angka di belakang koma, contoh **0,167**. $\\mathbb{E}[X]$ dihitung dari definisinya, $\\mathbb{E}[X] = 0\\cdot P(X=0) + 1\\cdot P(X=1)$ — tidak perlu rumus lain. Rekapan lemparan ketiga aturan ada di Papan Data Bagian D."
        },
        {
          id: "D2", tipe: "teks",
          soal: "Ambil satu aturan. Dari 60 lemparan itu kamu memperoleh $k$ sukses dan $n-k$ gagal. Tulis peluang satu barisan hasil seperti itu sebagai perkalian peluang tiap lemparan, memakai $p$.",
          petunjuk: "Satu barisan berarti urutan hasil yang sudah tetap, bukan sembarang urutan. **Contoh bentuk penulisan:** barisan 3 sukses lalu 2 gagal ditulis $p\\cdot p\\cdot p\\cdot(1-p)\\cdot(1-p)$. Ganti banyaknya $p$ dengan $k$ milikmu dan banyaknya $(1-p)$ dengan $n-k$."
        },
        {
          id: "D3", tipe: "tabel",
          soal: "Sekarang anggap $p$ belum diketahui. Hitung nilai perkalian pada jawaban sebelumnya untuk empat nilai $p$ berikut, memakai $k$ dan $n$ milikmu.",
          kolom: ["p", "nilai perkalian"],
          baris: [["0,1"], ["0,3"], ["0,5"], ["0,7"]],
          petunjuk: "Pakai kalkulator. Hasilnya angka sangat kecil, contoh bentuk penulisan: **0,000123** (tulis apa adanya, jangan dibulatkan menjadi 0)."
        },
        {
          id: "D4", tipe: "teks",
          soal: "Nilai $p$ mana yang memberi hasil terbesar? Bandingkan dengan $k/n$ milikmu."
        },
        {
          id: "D5", tipe: "teks",
          soal: "Penduga $p$ yang memaksimumkan perkalian itu bernama **MLE** (maximum likelihood estimate). Tulis rumusnya untuk data ini, lalu jelaskan dalam satu kalimat mengapa bentuknya sesederhana itu."
        }
      ],
      materi: {
        judul: "Materi D — Fungsi likelihood, MLE, dan ragam",
        isi: [
          "Peluang satu barisan hasil dengan $k$ sukses dan $n-k$ gagal adalah $L(p)=p^{k}(1-p)^{n-k}$. Inilah **fungsi likelihood**: fungsi dari $p$, sedangkan datanya dianggap tetap.",
          "Nilai $p$ yang memaksimumkan $L(p)$ disebut **MLE**. Karena $\\ln$ naik monoton, cukup memaksimumkan $\\ell(p)=k\\ln p+(n-k)\\ln(1-p)$.",
          "Turunan pertamanya nol: $\\dfrac{k}{p}-\\dfrac{n-k}{1-p}=0$, sehingga $\\hat p_{\\mathrm{MLE}}=\\dfrac{k}{n}$.",
          "Untuk peubah indikator: $\\mathbb{E}[X]=p$ dan $\\operatorname{Var}(X)=p(1-p)$. Bandingkan dengan tabel aturan suksesmu: ragam terbesar ada di $p=0{,}5$ karena hasilnya paling tidak pasti.",
          "Keterbatasan MLE: bila $k=0$ atau $k=n$, dugaan jatuh tepat di 0 atau 1. Data sedikit selalu mengandung ketidakpastian, sehingga selang lebih jujur daripada satu angka."
        ]
      }
    },

    {
      kode: "E", misi: 5,
      judul: "Menggabungkan data kelas",
      ringkas: "dua cara gabung · menuju Binomial",
      tujuan: "Membandingkan dua cara menggabungkan data beberapa orang, lalu memilih yang lebih masuk akal.",
      butir: [
        {
          id: "E1", tipe: "tabel",
          soal: "Sekarang gabungkan datamu dengan tiga baris pada tabel panel atas. Yang dipakai hanya dua angka per baris: $n$ dan $k$ (baris \"kamu\" ikut dihitung). Isi dua hasil berikut. **(1) Gabungan:** jumlahkan semua $k$, lalu bagi dengan jumlah semua $n$. **(2) Rata-rata:** hitung dulu $\\hat p$ tiap baris, lalu jumlahkan keempat $\\hat p$ itu dan bagi dengan 4.",
          kolom: ["Cara", "Hasil"],
          baris: [["Gabungan: $\\Sigma k \\div \\Sigma n$"], ["Rata-rata: $(\\hat p_1+\\hat p_2+\\hat p_3+\\hat p_4) \\div 4$"]],
          petunjuk: "**Dari mana angka itu datang?** $\\hat p$ (dibaca \"p topi\") adalah $k \\div n$ untuk satu baris — kolom yang kamu buat sendiri di Bagian B. Contoh: baris dengan $n=80$ dan $k=12$ memberi $\\hat p=12 \\div 80=0{,}150$. Tulis hasil dalam desimal tiga angka, misalnya **0,164**."
        },
        {
          id: "E2", tipe: "teks",
          soal: "Bandingkan dua angka yang baru kamu isi di E1. Kapan keduanya sama, kapan berbeda? Sebutkan penyebabnya dengan melihat kolom $n$ pada tabel panel atas."
        },
        {
          id: "E3", tipe: "teks",
          soal: "Kalau $n$ tiap orang berbeda-beda, cara mana yang kamu pakai — gabungan atau rata-rata? Mengapa?"
        },
        {
          id: "E4", tipe: "teks",
          soal: "Sekarang bayangkan lima lemparan seperti di Bagian A diulang 20 kali. Kalau tiap ulangan dicatat jumlah suksesnya, nilai apa saja yang mungkin muncul? Berapa nilai terkecil dan terbesarnya?"
        }
      ],
      materi: {
        judul: "Materi E — Gabungan data, dan dari Bernoulli ke Binomial",
        isi: [
          "Gabungan $\\dfrac{\\Sigma k}{\\Sigma n}$ disebut estimasi **tertimbang**: orang dengan $n$ besar menyumbang lebih banyak informasi. Rata-rata $\\hat p$ tanpa pembobotan memberi bobot sama kepada setiap orang.",
          "Keduanya sama bila semua $n$ sama besar, dan berbeda bila $n$ tidak sama. Pembobotan $n$ lebih tepat karena memakai seluruh data, bukan hanya ringkasannya.",
          "Kaitannya dengan hukum bilangan besar: selama $n$ bertambah, $\\dfrac{\\Sigma k}{\\Sigma n}$ makin dekat ke $p$.",
          "**Dari Bernoulli ke Binomial.** Satu lemparan adalah percobaan Bernoulli. Bila percobaan Bernoulli dilakukan $n$ kali secara bebas dengan peluang sukses $p$, jumlah sukses $Y$ berdistribusi Binomial: $Y\\sim\\mathrm{Binomial}(n,p)$ dengan $P(Y=y)=\\dbinom{n}{y}p^{y}(1-p)^{n-y}$ untuk $y=0,1,\\dots,n$.",
          "Jadi Bernoulli adalah Binomial dengan $n=1$. Contoh pada media ini: dari 100 lemparan dadu, jumlah munculnya angka 6 adalah $Y\\sim\\mathrm{Binomial}\\left(100,\\tfrac{1}{6}\\right)$."
        ]
      }
    }
  ];

  root.LKM_DATA = DATA;
})(typeof globalThis !== "undefined" ? globalThis : this);
