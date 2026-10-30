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
          petunjuk: "Tulis perkiraanmu dulu. Tidak ada jawaban yang salah di sini."
        },
        {
          id: "A2", tipe: "tabel",
          soal: "Lempar dadu lima kali dengan tombol **Lempar dadu**. Tulis angka yang muncul, lalu tulis **S** kalau muncul 6 dan **G** kalau bukan 6.",
          kolom: ["Lemparan", "Angka dadu", "S / G"],
          baris: [["1"], ["2"], ["3"], ["4"], ["5"]],
          petunjuk: "Deret angka dadu yang kamu peroleh juga tampil di panel data tiap bagian."
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
          petunjuk: "Deret angka dadu hasil percobaanmu tampil di panel data bagian ini."
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
          petunjuk: "Angka ini mengunci tebakanmu; setelah tersimpan tombol Lempar 100× terbuka."
        },
        {
          id: "C2", tipe: "tabel",
          soal: "Setelah seratus lemparan selesai, catat nilai $\\hat p$ pada beberapa nilai $n$ dari grafik $\\hat p$ terhadap $n$.",
          kolom: ["n", "p̂"],
          baris: [["10"], ["20"], ["40"], ["60"], ["80"], ["100"]],
          petunjuk: "Grafiknya ada di panel kanan (di ponsel: di bawah grafik dadu)."
        },
        {
          id: "C3", tipe: "teks",
          soal: "Apa yang terjadi pada $\\hat p$ ketika $n$ bertambah? Jelaskan dengan kata-katamu sendiri."
        },
        {
          id: "C4", tipe: "angka",
          soal: "Pada $n=100$, berapa jarak $\\hat p$ dengan $p=\\dfrac{1}{6}$? Tulis dengan tiga angka di belakang koma.",
          petunjuk: "Jarak di sini artinya selisih yang selalu positif: $|\\hat p-p|$."
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
          soal: "Lempar 60 kali untuk masing-masing aturan sukses (6 saja, ≥ 5, ≥ 4). Setelah itu isi $p$ dan $\\mathbb{E}[X]$ untuk tiap aturan.",
          kolom: ["Aturan sukses", "|A|", "p", "E[X]"],
          baris: [["6 saja", "1"], ["≥ 5", "2"], ["≥ 4", "3"]],
          petunjuk: "$|A|$ adalah banyaknya sisi yang dihitung sukses. Semua sisi dadu punya peluang sama."
        },
        {
          id: "D2", tipe: "teks",
          soal: "Ambil satu aturan. Dari 60 lemparan itu kamu memperoleh $k$ sukses dan $n-k$ gagal. Tulis peluang satu barisan hasil seperti itu sebagai perkalian peluang tiap lemparan, memakai $p$.",
          petunjuk: "Satu barisan berarti urutan hasil yang sudah tetap, bukan sembarang urutan."
        },
        {
          id: "D3", tipe: "tabel",
          soal: "Sekarang anggap $p$ belum diketahui. Hitung nilai perkalian pada jawaban sebelumnya untuk empat nilai $p$ berikut, memakai $k$ dan $n$ milikmu.",
          kolom: ["p", "nilai perkalian"],
          baris: [["0,1"], ["0,3"], ["0,5"], ["0,7"]],
          petunjuk: "Pakai kalkulator. Angka hasilnya akan sangat kecil — tulis apa adanya."
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
          soal: "Setelah tabel data kelas terisi (tiga teman, atau simulasi), hitung dua cara penggabungan dengan tangan: jumlahkan $k$ lalu bagi jumlah $n$, dan rata-ratakan keempat $\\hat p$.",
          kolom: ["Cara", "Hasil"],
          baris: [["Gabungan $\\Sigma k/\\Sigma n$"], ["Rata-rata $\\hat p$"]]
        },
        {
          id: "E2", tipe: "teks",
          soal: "Kapan kedua hasil itu sama? Kapan berbeda? Beri contoh dari tabelmu."
        },
        {
          id: "E3", tipe: "teks",
          soal: "Kalau $n$ temanmu berbeda-beda, cara mana yang kamu pakai? Mengapa?"
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
