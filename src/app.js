/* =========================================================
   app.js — router, layar, dan interaksi "Ruang Bernoulli: Misi Dadu"
   Satu percobaan = satu lemparan. Semua state lewat Store.
   ========================================================= */
(function () {
  "use strict";

  var S = window.Store;
  var L = window.Laporan;
  var K = window.LKM;
  var A = window.Auth;
  var SN = window.Sinkron;

  function masukServer() { return !!(A && A.aktif()); }
  function labelSesi() { return A && A.label ? A.label() : ""; }

  var state = S.baca();
  var ui = { sheet: null, pesan: null, ringkas: false, kunciRute: null, eN: 6, cobaLagi: false };

  var $app = document.getElementById("app");

  /* ---------------- util ---------------- */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dec(x, d) { return Number(x).toFixed(d === undefined ? 3 : d).replace(".", ","); }
  function pecahan(a, b) { return a + "/" + b; }

  function route() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    var p = h.split("/").filter(Boolean);
    if (p[0] === "misi" && p[1]) {
      var id = Math.max(1, Math.min(5, parseInt(p[1], 10) || 1));
      return { view: p[2] === "data" ? "data" : "arena", id: id };
    }
    return { view: "home", id: S.aktif(state) };
  }
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function segbar() {
    var cur = S.aktif(state);
    var out = '<div class="seg" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) {
      var st = S.status(state, i);
      out += '<i class="' + (st === "selesai" ? "on" : (i === cur && st !== "selesai" ? "cur" : "")) + '"></i>';
    }
    return out + "</div>";
  }

  /* ---------------- dadu ---------------- */
  function pips(v) {
    var pos = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    var on = pos[v] || pos[1];
    var out = "";
    for (var i = 1; i <= 9; i++) out += '<i class="' + (on.indexOf(i) >= 0 ? "" : "off") + '"></i>';
    return out;
  }
  function dieHTML(v, redup) {
    return '<div class="die' + (redup ? " redup" : "") + '" role="img" aria-label="Dadu menunjukkan ' + v + '">' + pips(v) + "</div>";
  }
  function diceHTML(arr, redup) {
    var out = '<div class="dice-row">';
    for (var i = 0; i < arr.length; i++) {
      out += '<span class="die-wrap">' + dieHTML(arr[i], redup) + "</span>";
    }
    return out + "</div>";
  }
  function chip(txt, tone) { return '<span class="chip ' + (tone || "") + '">' + txt + "</span>"; }
  function sgTanda(ok) {
    return '<b class="sg ' + (ok ? "s" : "g") + '">' + (ok ? "S" : "G") + "</b>";
  }

  /* ---------------- aturan ---------------- */
  /* pilihan cepat per misi; Misi E menyusun sendiri (lihat panelE) */
  var PILIHAN = {
    2: [
      { kunci: "b-ganjil", at: { jenis: "ganjil" }, teks: "Angka ganjil" },
      { kunci: "b-genap", at: { jenis: "genap" }, teks: "Angka genap" },
      { kunci: "b-min5", at: { jenis: "min", n: 5 }, teks: "Muncul 5 atau lebih" },
      { kunci: "b-maks2", at: { jenis: "maks", n: 2 }, teks: "Muncul 2 atau kurang" }
    ],
    3: [
      { kunci: "c-genap", at: { jenis: "jumlah", mode: "genap" }, teks: "Jumlah genap" },
      { kunci: "c-ganjil", at: { jenis: "jumlah", mode: "ganjil" }, teks: "Jumlah ganjil" },
      { kunci: "c-7", at: { jenis: "jumlah", mode: "sama", n: 7 }, teks: "Jumlah = 7" }
    ]
  };

  function aturanDariKunci(kunci) {
    var daftar = (PILIHAN[2] || []).concat(PILIHAN[3] || []);
    for (var i = 0; i < daftar.length; i++) if (daftar[i].kunci === kunci) return daftar[i].at;
    return null;
  }
  function kunciDariAturan(at) {
    if (!at) return "";
    var daftar = (PILIHAN[2] || []).concat(PILIHAN[3] || []);
    for (var i = 0; i < daftar.length; i++) {
      if (JSON.stringify(daftar[i].at) === JSON.stringify(at)) return daftar[i].kunci;
    }
    return "";
  }

  /* gerbang: semua butir fase "pra" (prediksi) harus terisi sebelum melempar */
  function prediksiSiap(id) {
    var b = K.forMisi(id);
    if (!b) return true;
    var pra = b.butir.filter(function (bt) { return bt.fase === "pra"; });
    for (var i = 0; i < pra.length; i++) if (!S.adaJawaban(state, pra[i].id)) return false;
    return true;
  }
  function aturanSiap(id) {
    var m = S.def(id);
    if (!m || m.dadu === 0) return true;
    return !!(S.rek(state, id).aturan);
  }
  function bisaLempar(id) {
    if (S.status(state, id) === "terkunci") return false;
    if (id === 4) return false;
    return aturanSiap(id) && prediksiSiap(id);
  }

  /* Papan Data: terbuka setelah percobaan bagian itu terjadi (Misi D tidak
     melempar, jadi cukup bagiannya terbuka). */
  function papanSiap(id) {
    if (S.status(state, id) === "selesai") return true;
    return S.percobaanSelesai(state, id);
  }
  function tombolPapan(id) {
    if (papanSiap(id)) return '<button class="mini-btn" data-act="data" data-id="' + id + '">Papan data</button>';
    return '<button class="mini-btn" data-act="data" data-id="' + id +
      '" disabled title="Terbuka setelah percobaan bagian ini dilakukan">Papan data</button>';
  }

  /* ---------------- header ---------------- */
  function header(opts) {
    opts = opts || {};
    var left = opts.back
      ? '<button class="back" data-act="back" aria-label="Kembali">←</button>'
      : '<div class="mark" aria-hidden="true">⚄</div>';
    var subTeks = opts.sub || "Misi Dadu";
    var subPendek = String(subTeks).split("·")[0].trim();
    return '<header class="bar">' +
      left +
      '<div class="brand">' +
      '<div><div class="brand-name">' + (opts.title || "Ruang Bernoulli") + "</div>" +
      '<div class="brand-sub"><span class="sub-l">' + subTeks + '</span><span class="sub-s">' + subPendek + "</span>" +
      (labelSesi() ? '<span class="who">' + esc(labelSesi()) + "</span>" : "") +
      '<button class="whoami" data-act="tentang" aria-label="Kredit tim pengembang">Tim Pengembang</button>' +
      "</div></div>" +
      "</div>" +
      (opts.right || "") +
      "</header>";
  }

  /* ---------------- HOME = sampul LKM ---------------- */
  function renderHome() {
    var selesai = S.jumlahSelesai(state);
    var aktif = S.aktif(state);
    var mulai = S.sudahMulai(state);
    var semuaSelesai = selesai === 5;
    var totalButir = 0, terisiButir = 0;
    K.DATA.forEach(function (b) {
      var j = K.jumlahTerisi(b.kode, state);
      totalButir += j.total;
      terisiButir += j.terisi;
    });

    var judul = semuaSelesai
      ? "Semua bagian selesai."
      : (mulai ? "Lanjutkan Bagian " + K.forMisi(aktif).kode : "Lembar kerja distribusi Bernoulli");
    var sub = semuaSelesai
      ? "Kamu boleh membuka bagian mana pun untuk membaca ulang materi, atau mengunduh progres sebagai arsip."
      : (mulai
        ? terisiButir + " dari " + totalButir + " butir sudah terjawab."
        : "Satu dadu, satu lemparan per percobaan. Konsepnya kamu temukan sendiri lewat percobaan; materi menyusul setelah lembar kerjanya selesai.");

    var list = "";
    S.MISI.forEach(function (m) {
      var b = K.forMisi(m.id);
      var st = S.status(state, m.id);
      var j = b ? K.jumlahTerisi(b.kode, state) : { terisi: 0, total: 0 };
      var cls = st === "selesai" ? "done" : (m.id === aktif ? "active" : "locked");
      var num = st === "selesai" ? "✓" : b.kode;
      var note = "Bagian " + b.kode + " · " + j.terisi + "/" + j.total + " butir · " + b.ringkas;
      list += '<button class="mission ' + cls + '" data-act="open" data-id="' + m.id + '">' +
        '<span class="m-num">' + num + "</span>" +
        '<span class="m-txt"><span class="m-title">' + esc(b.judul) + '</span><span class="m-note">' + esc(note) + "</span></span>" +
        (st === "selesai" ? "" : '<span class="m-go">›</span>') +
        "</button>";
    });

    var tujuan = '<div class="panel"><div class="panel-head"><b>Tujuan pembelajaran</b><span>TP1–TP5</span></div>' +
      '<ol class="steps tujuan-list">' +
      K.DATA.map(function (b) { return "<li>" + K.md(b.tp) + "</li>"; }).join("") +
      "</ol></div>";

    var petunjuk = '<div class="panel"><div class="panel-head"><b>Cara kerja</b></div>' +
      '<ol class="steps">' +
      "<li>Kerjakan berurutan dari Bagian A sampai E; setiap bagian terbuka setelah bagian sebelumnya selesai.</li>" +
      "<li>Tulis <b>prediksi</b> dulu. Setelah prediksi terisi, tombol lempar terbuka.</li>" +
      "<li>Satu percobaan = <b>satu lemparan</b>. Tombol lempar boleh ditekan lagi, tetapi hasil lama tidak dihitung.</li>" +
      "<li>Jawab pertanyaan di blok <b>refleksi</b>. Materi bagian itu terbuka setelah semua butir terjawab.</li>" +
      "<li><b>Papan Data</b> menyimpan hasil percobaanmu dan kode laporan.</li>" +
      "</ol></div>";

    var sesiKelas = masukServer() ? A.data().kelas : state.peserta.kelas;
    var namaAwal = state.peserta.nama || (masukServer() ? A.data().nama : "");
    var nimAwal = state.peserta.nim || (masukServer() ? A.data().nim : "");
    var ident = '<div class="panel" id="identCard">' +
      '<div class="panel-head"><b>Identitas</b><span>' +
      (masukServer() ? "kelas mengikuti kode akses" : "isi sebelum mengumpulkan") + "</span></div>" +
      '<div class="idrow idrow-3">' +
      '<input class="inp" data-ident="nama" value="' + esc(namaAwal) + '" placeholder="Nama lengkap" aria-label="Nama lengkap">' +
      '<input class="inp" data-ident="nim" value="' + esc(nimAwal) + '" inputmode="numeric" placeholder="NIM" aria-label="NIM">' +
      '<input class="inp" data-ident="kelas" value="' + esc(sesiKelas) + '" placeholder="Kelas" aria-label="Kelas"' +
      (masukServer() ? " readonly" : "") + ">" +
      "</div>" +
      '<p class="note">' + (masukServer()
        ? "Kelas dikunci oleh kode akses. Nama &amp; NIM dipakai pada rekap pengembang."
        : "Dipakai sebagai label lembar kerja dan kode laporan. Tersimpan di perangkat ini.") + "</p></div>";

    return header({
      title: "Ruang Bernoulli",
      sub: "LKM digital · Statistika Matematika",
      right: chip(selesai + " / 5 bagian")
    }) +
      '<main class="body">' +
      '<div class="hero"><div class="eyebrow">Lembar Kerja Mahasiswa · Distribusi Bernoulli</div>' +
      '<h2 class="title">' + esc(judul) + "</h2>" +
      '<p class="sub">' + sub + "</p></div>" +
      segbar() + ident + tujuan + petunjuk +
      '<div class="mlist">' + list + "</div>" +
      (ui.pesan ? '<div class="toast">✓ <div>' + ui.pesan + "</div></div>" : "") +
      "</main>" +
      '<footer class="cta">' +
      '<button class="btn btn-primary" data-act="open" data-id="' + aktif + '">' +
      (semuaSelesai ? "Buka Bagian " + K.forMisi(aktif).kode : (mulai ? "Lanjutkan Bagian " + K.forMisi(aktif).kode : "Mulai Bagian A")) +
      " &nbsp;→</button>" +
      '<div class="linkrow">' +
      (mulai ? '<button class="link warn" data-act="reset-open">↻ Mulai ulang</button>' : "") +
      '<button class="link" data-act="import">⇩ Pulihkan</button>' +
      (mulai ? '<button class="link" data-act="export">⇧ Unduh progres</button>' : "") +
      (masukServer() ? '<button class="link" data-act="sinkron">⇅ Kirim sekarang</button>' : "") +
      (masukServer() ? '<button class="link warn" data-act="hapus-open">Hapus data saya</button>' : "") +
      "</div>" +
      '<div class="devicenote" id="statusSimpan"><i class="dot-ok"></i> ' +
      (masukServer() ? "Tersambung ke server pengumpulan" : "Jawaban tersimpan di perangkat ini") + "</div>" +
      "</footer>" +
      sheetHTML() +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  /* ---------------- arsip tim & lembar konfirmasi ---------------- */
  var TIM = [
    ["Ahmad As Siddiq", "06081282429062"],
    ["Annisa Putri S.", "06081282429036"],
    ["Fathia Aiva", "06081382429083"],
    ["Sherin Az Zahra", "06081382429085"]
  ];

  function sheetTentang() {
    var tim = TIM.map(function (t) {
      return '<li><span class="nm">' + esc(t[0]) + '</span><span class="nim">' + esc(t[1]) + "</span></li>";
    }).join("");
    return '<div class="overlay" data-act="sheet-close">' +
      '<div class="sheet tentang" data-stop="1">' +
      '<div class="eyebrow">Tentang media</div>' +
      "<h4>Ruang Bernoulli: Misi Dadu</h4>" +
      '<div class="divider"></div>' +
      '<div class="eyebrow">Tim pengembang · Kelompok 9</div>' +
      '<ol class="tim">' + tim + "</ol>" +
      '<div class="inst">' +
      "PROGRAM STUDI PENDIDIKAN MATEMATIKA<br>FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN<br>UNIVERSITAS SRIWIJAYA" +
      '<span class="tahun">2026</span></div>' +
      '<div class="acts" style="margin-top:14px"><button class="b2" data-act="sheet-close">Tutup</button></div>' +
      "</div></div>";
  }

  function sheetHapus() {
    if (ui.hapusLangkah === 2) {
      return '<div class="overlay" data-act="sheet-close"><div class="sheet" data-stop="1">' +
        "<h4>Hapus permanen?</h4>" +
        "<p>Jawaban, hasil percobaan, dan identitasmu akan dihapus dari <b>perangkat ini dan server</b>. Pengembang tidak bisa memulihkannya.</p>" +
        '<div class="acts"><button class="b1" data-act="hapus-konfirm">Ya, hapus permanen</button>' +
        '<button class="b2" data-act="sheet-close">Batal</button></div>' +
        "</div></div>";
    }
    return '<div class="overlay" data-act="sheet-close"><div class="sheet" data-stop="1">' +
      "<h4>Hapus data saya</h4>" +
      "<p>Semua jawaban dan progres di perangkat ini akan dihapus. Kalau kamu masuk dengan kode akses, data yang sudah terkirim ke server juga ikut dihapus.</p>" +
      '<div class="acts"><button class="b1" data-act="hapus-siap">Lanjut</button>' +
      '<button class="b2" data-act="sheet-close">Batal</button></div></div></div>';
  }

  function sheetReset() {
    return '<div class="overlay" data-act="sheet-close">' +
      '<div class="sheet" data-stop="1">' +
      "<h4>Mulai ulang dari awal?</h4>" +
      "<p>Semua hasil percobaan, jawaban lembar kerja, dan progres lima bagian akan dihapus. Kode laporan yang sudah kamu salin di tempat lain tidak terpengaruh.</p>" +
      '<div class="acts">' +
      '<button class="b1" data-act="reset-confirm">Ya, hapus progres</button>' +
      '<button class="b2" data-act="sheet-close">Batal</button>' +
      "</div>" +
      '<button class="link warn tiny" data-act="reset-all">Hapus semua termasuk nama &amp; NIM</button>' +
      "</div></div>";
  }

  function sheetHTML() {
    if (ui.sheet === "reset") return sheetReset();
    if (ui.sheet === "hapus") return sheetHapus();
    if (ui.sheet === "tentang") return sheetTentang();
    return "";
  }

  /* ---------------- ARENA ---------------- */
  var INSTRUKSI = {
    1: {
      langkah: [
        "Isi butir <b>A1</b> dulu: hasil apa saja yang mungkin muncul.",
        "Tekan <b>Lempar dadu</b> satu kali. Kotak dadu menunjukkan hasilnya.",
        "Baca hasilnya: masuk kelompok <b>muncul 6</b> atau <b>bukan 6</b>?",
        "Jawab A2–A5 di blok refleksi. Materi terbuka setelah semua butir terisi."
      ]
    },
    2: {
      langkah: [
        "Pilih salah satu <b>aturan sukses</b> di panel aturan; pilihannya bebas.",
        "Isi butir <b>B1</b>: tulis aturanmu dan tebak peluangnya.",
        "Tekan <b>Lempar dadu</b> satu kali, lalu periksa S atau G.",
        "Jawab B2–B4: hitung p dari banyak sisi, lalu bandingkan dengan tebakanmu."
      ]
    },
    3: {
      langkah: [
        "Dua dadu dilempar <b>sekali</b>; yang dicatat jumlah kedua dadu.",
        "Pilih <b>aturan</b> (jumlah genap, ganjil, atau = 7) di panel aturan, lalu isi butir <b>C1</b>.",
        "Tekan <b>Lempar dua dadu</b>. Hasil kedua dadu muncul berdampingan.",
        "Jawab C2–C4: hitung |A| dari 36 pasangan, lalu jelaskan mengapa tetap Bernoulli."
      ]
    },
    4: {
      langkah: [
        "Bagian ini <b>tidak melempar dadu</b>. Datanya diambil dari Misi A (p = 1/6).",
        "Isi tabel <b>D1</b>: sebaran X untuk x = 0 dan x = 1.",
        "Kerjakan <b>D2</b>: uji bentuk $p^{x}(1-p)^{1-x}$ untuk kedua nilai x.",
        "Jawab <b>D3</b>: tulis lambang distribusinya, lalu ganti p dengan hasil Misi B/C."
      ]
    },
    5: {
      langkah: [
        "Rancang aturanmu sendiri di panel aturan (angka tertentu, ganjil/genap, atau batas ≥/≤).",
        "Tulis aturan dan alasannya di <b>E1</b>, lalu hitung p di <b>E2</b>.",
        "Tekan <b>Lempar dadu</b> satu kali. Hasilnya dicatat di E3.",
        "Jawab <b>E4</b>: ciri percobaan Bernoulli, rumusnya, dan mengapa satu lemparan saja."
      ]
    }
  };

  function instruksiBox(id) {
    var d = INSTRUKSI[id];
    var li = d.langkah.map(function (t) {
      return "<li>" + K.md(String(t).replace(/<\/?b>/g, "**")) + "</li>";
    }).join("");
    var m = S.def(id);
    return '<div class="panel instruksi" data-stop="1">' +
      '<div class="panel-head"><b>Bagian ' + K.forMisi(id).kode + " · Misi " + id + "</b><span>" + m.sub + "</span></div>" +
      '<ol class="steps">' + li + "</ol></div>";
  }

  /* panel tujuan pembelajaran + butir buktinya */
  function tpBox(id) {
    var b = K.forMisi(id);
    var ids = b.butir.map(function (bt) { return bt.id; }).join(" · ");
    return '<div class="target"><div class="eyebrow">Tujuan bagian ini</div>' +
      K.md(b.tp) +
      '<div class="note">Butir bukti: <b>' + ids + "</b></div></div>";
  }

  /* ---------- pemilih aturan ---------- */
  function panelAturan(id, r) {
    if (id === 1) {
      return '<div class="panel"><div class="panel-head"><b>Aturan sukses</b><span>tetap untuk bagian ini</span></div>' +
        '<p class="note">Muncul <b>angka 6</b> → sukses (S). Selain 6 → gagal (G).</p></div>';
    }
    if (id === 5) return panelE(r);

    var daftar = PILIHAN[id] || [];
    var aktif = r.aturan;
    var tombol = daftar.map(function (o) {
      var on = kunciDariAturan(aktif) === o.kunci;
      return '<button class="opsi-btn' + (on ? " on" : "") + '" data-act="pilih-aturan" data-id="' + id +
        '" data-kunci="' + o.kunci + '" aria-pressed="' + on + '">' + esc(o.teks) + "</button>";
    }).join("");
    return '<div class="panel"><div class="panel-head"><b>Pilih aturan sukses</b><span>' +
      (aktif ? "aturanmu: " + esc(S.label(aktif)) : "belum dipilih") + "</span></div>" +
      '<div class="opsi">' + tombol + "</div>" +
      '<p class="note">Pilih satu aturan. Peluangnya nanti kamu hitung sendiri; panel ini tidak menampilkan p.</p></div>';
  }

  function panelE(r) {
    var at = r.aturan || {};
    var jenis = at.jenis || "";
    var opsi = [
      { k: "angka", t: "Angka tertentu" },
      { k: "ganjil", t: "Angka ganjil" },
      { k: "genap", t: "Angka genap" },
      { k: "min", t: "≥ n" },
      { k: "maks", t: "≤ n" }
    ];
    var tombol = opsi.map(function (o) {
      return '<button class="opsi-btn' + (jenis === o.k ? " on" : "") + '" data-act="e-jenis" data-id="5" data-jenis="' +
        o.k + '" aria-pressed="' + (jenis === o.k) + '">' + esc(o.t) + "</button>";
    }).join("");
    var n = at.n || ui.eN;
    var pakaiN = jenis === "angka" || jenis === "min" || jenis === "maks";
    var stepper = pakaiN
      ? '<div class="stepper"><button data-act="e-n" data-d="-1" aria-label="kurangi">−</button>' +
        '<div class="val">' + n + "</div>" +
        '<button data-act="e-n" data-d="1" aria-label="tambah">+</button></div>' +
        '<p class="note">' + (jenis === "angka"
          ? "Aturan: muncul angka " + n + "."
          : (jenis === "min" ? "Aturan: muncul " + n + " atau lebih." : "Aturan: muncul " + n + " atau kurang.")) + "</p>"
      : (jenis ? '<p class="note">Aturan: ' + esc(S.label(at)) + ".</p>"
        : '<p class="note">Pilih jenis aturan dulu. Aturanmu harus membagi enam sisi menjadi dua kelompok, keduanya tidak boleh kosong.</p>');

    return '<div class="panel"><div class="panel-head"><b>Rancang aturan suksesmu</b><span>' +
      (jenis ? esc(S.label(at)) : "belum disusun") + "</span></div>" +
      '<div class="opsi">' + tombol + "</div>" + stepper + "</div>";
  }

  /* ---------- hasil percobaan di arena ---------- */
  function kartuHasil(id, r) {
    var m = S.def(id);
    if (!m || m.dadu === 0) {
      return '<div class="panel"><div class="panel-head"><b>Tanpa lemparan</b><span>data dari Misi A</span></div>' +
        '<p class="note">Bagian D memakai hasil percobaan Misi A. Tidak ada dadu yang perlu dilempar di sini.</p></div>';
    }
    if (!r.aturan) {
      return '<div class="predict"><div class="q">Pilih <b>aturan sukses</b> di panel bawah dulu. Tombol lempar terbuka setelah aturan dan prediksi terisi.</div></div>';
    }
    if (!r.hasil) {
      return '<div class="die-stage">' + diceHTML(m.dadu === 2 ? [3, 4] : [1], true) + "</div>" +
        '<div class="panel"><div class="panel-head"><b>Aturanmu</b><span>' + esc(S.label(r.aturan)) + "</span></div>" +
        '<p class="note">Tekan tombol lempar di bawah. Satu percobaan = satu lemparan.</p></div>';
    }
    var ok = S.cocok(r.hasil, r.aturan);
    var jumlah = r.hasil.length === 2 ? " · jumlah " + (r.hasil[0] + r.hasil[1]) : "";
    return '<div class="die-stage">' + diceHTML(r.hasil, false) + "</div>" +
      '<div class="panel"><div class="panel-head"><b>Hasil percobaan</b><span>' + esc(S.label(r.aturan)) + jumlah + "</span></div>" +
      '<p class="note">Dadu: <b>' + r.hasil.join(" dan ") + "</b> · hasilnya " + sgTanda(ok) +
      " (" + (ok ? "masuk aturan" : "tidak masuk aturan") + ").</p>" +
      '<p class="note">Satu percobaan = satu lemparan. Hasil ini yang kamu pakai di lembar kerja.</p>' +
      "</div>";
  }

  /* saat siswa menekan "Lempar lagi": jelaskan aturannya, jangan langsung melempar */
  function notisUlang(id) {
    return '<div class="predict" id="notisUlang" data-stop="1">' +
      '<div class="q">Percobaan Bagian ' + K.forMisi(id).kode + ' sudah dilakukan.</div>' +
      '<p class="note" style="color:#6f4a10">Satu percobaan = <b>satu lemparan</b>. Lemparan kedua tidak dipakai ' +
      'dan tidak dijumlahkan dengan hasil pertama, jadi yang kamu olah di lembar kerja tetap satu percobaan Bernoulli. ' +
      'Kalau ingin mengganti hasil (misalnya tadi salah tekan), tekan <b>Ulangi percobaan</b>: hasil lama dihapus, ' +
      'lalu kamu melempar sekali lagi.</p>' +
      '<div class="acts">' +
      '<button class="b1 ok" data-act="ulangi" data-id="' + id + '">Ulangi percobaan</button>' +
      '<button class="b2" data-act="tutup-notis">Tetap pakai hasil ini</button>' +
      "</div></div>";
  }

  function selesaiCard(id, r, opts) {
    opts = opts || {};
    var b = K.forMisi(id);
    var j = K.jumlahTerisi(b.kode, state);
    var nextHint = id < 5
      ? "Bagian " + K.forMisi(id + 1).kode + " sudah terbuka."
      : "Semua bagian selesai. Baca ulang materi kapan saja, atau kembali ke sampul.";
    return '<div class="selesai"><div class="eyebrow">✓ Bagian ' + b.kode + " selesai</div>" +
      "<h4>" + esc(b.judul) + "</h4>" +
      '<ol class="steps">' +
      "<li>Percobaan bagian ini sudah dilakukan.</li>" +
      "<li>Semua " + j.total + " butir lembar kerja sudah terjawab.</li>" +
      "<li>Materi Bagian " + b.kode + " terbuka di bawah — bacalah untuk memeriksa jawabanmu.</li>" +
      "</ol>" +
      (opts.papan ? "" : '<div class="btn-row"><button class="mini-btn" data-act="data" data-id="' + id +
        '">Buka Papan Data Bagian ' + b.kode + " →</button></div>") +
      '<p class="next-hint">' + nextHint + "</p></div>";
  }

  function renderArena(id) {
    var b = K.forMisi(id);
    var r = S.rek(state, id);
    var st = S.status(state, id);
    var isi;

    /* urutan: instruksi → TP → panel aturan → prediksi (pra) → hasil → refleksi */
    if (st === "terkunci") {
      isi = '<div class="locked-note">Bagian ini terbuka setelah Bagian ' + K.forMisi(id - 1).kode +
        ' selesai. <br><button class="link" data-act="home">Kembali ke sampul</button></div>';
    } else {
      isi = instruksiBox(id) + tpBox(id) +
        (S.def(id).dadu === 0 ? "" : panelAturan(id, r)) +
        K.renderPra(b.kode, state) +
        kartuHasil(id, r) +
        (ui.cobaLagi && r.hasil ? notisUlang(id) : "") +
        (st === "selesai" ? selesaiCard(id, r) : "") +
        K.renderPanel(b.kode, state);
    }

    var lkm = isi;

    return header({
      back: true,
      title: b.judul,
      sub: "Bagian " + b.kode + " · Misi " + id,
      right: chip("Bagian " + b.kode)
    }) +
      '<main class="body' + (id === 3 ? " wide" : "") + '">' + lkm + "</main>" +
      footerArena(id) +
      sheetHTML() +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  /* ---------------- footer aksi ---------------- */
  function footerArena(id) {
    var r = S.rek(state, id);
    var selesai = S.status(state, id) === "selesai";
    var b = K.forMisi(id);
    var m = S.def(id);
    var nextId = id < 5 ? id + 1 : null;
    var utama = "", kedua = "";
    var j = S.jumlahJawaban(state, b.kode);

    if (S.status(state, id) === "terkunci") {
      return '<footer class="cta' + (ui.ringkas ? " ringkas" : "") + '">' +
        '<div class="stack"><button class="btn btn-primary" data-act="home">Kembali ke sampul</button></div>' +
        '<p class="cta-hint">Bagian ' + b.kode + " terbuka setelah Bagian " + K.forMisi(id - 1).kode + " selesai.</p>" +
        "</footer>";
    }

    if (m.dadu === 0) {
      utama = papanSiap(id)
        ? '<button class="btn btn-primary" data-act="data" data-id="' + id + '">Buka Papan Data</button>'
        : '<button class="btn btn-primary" disabled>Isi butir D1–D3 dulu</button>';
      kedua = (nextId && selesai)
        ? '<button class="mini-btn" data-act="open" data-id="' + nextId + '">Lanjut ke Bagian ' + K.forMisi(nextId).kode + "</button>"
        : '<button class="mini-btn" data-act="home">Kembali ke sampul</button>';
    } else if (selesai && nextId) {
      utama = '<button class="btn btn-primary" data-act="open" data-id="' + nextId + '">Lanjut ke Bagian ' +
        K.forMisi(nextId).kode + " &nbsp;→</button>";
      kedua = tombolPapan(id) + '<button class="mini-btn" data-act="ulangi" data-id="' + id + '">Ulangi percobaan</button>';
    } else if (selesai) {
      utama = '<button class="btn btn-primary" data-act="home">Selesai · ke sampul</button>';
      kedua = tombolPapan(id);
    } else {
      var bisa = bisaLempar(id);
      var label = m.dadu === 2 ? "Lempar dua dadu" : "Lempar dadu";
      if (!aturanSiap(id)) {
        utama = '<button class="btn btn-primary" disabled>Pilih aturan dulu</button>';
      } else if (!prediksiSiap(id)) {
        utama = '<button class="btn btn-primary" disabled>Isi butir prediksi dulu</button>';
      } else if (r.hasil) {
        /* satu percobaan = satu lemparan: tidak ada lempar kedua */
        utama = '<button class="btn btn-ghost" data-act="coba-lagi" data-id="' + id + '">Lempar lagi</button>';
      } else {
        utama = '<button class="btn btn-primary" data-act="lempar" data-id="' + id + '"' + (bisa ? "" : " disabled") + ">" +
          label + "</button>";
      }
      kedua = tombolPapan(id) +
        (r.hasil ? '<button class="mini-btn" data-act="ulangi" data-id="' + id + '">Ulangi percobaan</button>' : "");
    }

    return '<footer class="cta' + (ui.ringkas ? " ringkas" : "") + '">' +
      (utama ? '<div class="stack">' + utama + "</div>" : "") +
      (kedua ? '<div class="btn-row">' + kedua + "</div>" : "") +
      '<p class="cta-hint">Bagian ' + b.kode + " · " + (selesai ? "selesai" : j.terisi + "/" + j.total + " butir terjawab") +
      "</p>" +
      (masukServer() ? '<div class="devicenote" id="statusSimpan"><i class="dot-ok"></i> Tersambung ke server</div>' : "") +
      "</footer>";
  }

  function refreshFooter() {
    var rt = route();
    if (rt.view !== "arena") return;
    var ft = document.querySelector("footer.cta");
    if (ft) ft.outerHTML = footerArena(rt.id);
  }

  /* ---------------- PAPAN DATA ---------------- */
  function kodeUntuk(id) {
    var r = S.rek(state, id);
    var m = S.def(id);
    if (!m || m.dadu === 0 || !r.hasil || !r.aturan) return "—";
    try {
      return L.encodeHasil({
        misi: id,
        duaDadu: m.dadu === 2,
        sisi: S.sisiSukses(r.aturan),
        x: S.cocok(r.hasil, r.aturan) ? 1 : 0
      });
    } catch (e) { return "—"; }
  }

  function dataUmum(id, r) {
    var m = S.def(id);
    var b = K.forMisi(id);
    var at = r.aturan;
    var sisi = at ? S.sisiSukses(at) : 0;
    var total = at ? S.ruangTotal(at) : (m.dadu === 2 ? 36 : 6);
    var ok = r.hasil && at ? S.cocok(r.hasil, at) : null;
    var baris = (r.riwayat || []).map(function (h, i) {
      var okH = at ? S.cocok(h, at) : null;
      return "<tr><td>" + (i + 1) + "</td><td>" + h.join(" + ") + "</td>" +
        '<td class="n">' + (h.length === 2 ? h[0] + h[1] : "") + "</td>" +
        '<td class="n">' + (okH === null ? "—" : (okH ? 1 : 0)) + "</td>" +
        '<td class="n">' + (okH === null ? "—" : (okH ? "S" : "G")) + "</td></tr>";
    }).join("");

    return header({ back: true, title: "Papan Data", sub: "Bagian " + b.kode + " · data percobaan", right: chip("✓ Bagian " + b.kode) }) +
      '<main class="body wide">' +
      (S.status(state, id) === "selesai" ? selesaiCard(id, r, { papan: true }) : "") +
      '<div class="toast">✓ <div><b>Bagian ' + b.kode + ":</b> angka di halaman ini boleh langsung kamu pakai untuk mengisi lembar kerja. <b>Kode laporan</b> ada di kotak paling bawah.</div></div>" +
      '<div class="colstack">' +
      '<div class="stats">' +
      '<div class="stat"><span>|A|</span><b>' + (at ? sisi : "—") + "</b></div>" +
      '<div class="stat"><span>|Ω|</span><b>' + (at ? total : "—") + "</b></div>" +
      '<div class="stat accent"><span>p = |A| / |Ω|</span><b>' + (at ? dec(sisi / total, 3) : "—") + "</b></div>" +
      "</div>" +
      '<div class="panel"><div class="panel-head"><b>Aturan &amp; hasil</b><span>' +
      (at ? esc(S.label(at)) : "belum ada aturan") + "</span></div>" +
      '<p class="note">Hasil lemparan terakhir: <b>' + (r.hasil ? r.hasil.join(" dan ") : "—") + "</b>" +
      (ok === null ? "" : " → " + (ok ? "S (sukses)" : "G (gagal)")) + "</p>" +
      '<table><thead><tr><th>#</th><th>dadu</th><th class="rt">jumlah</th><th class="rt">X</th><th class="rt">S/G</th></tr></thead><tbody>' +
      (baris || '<tr><td colspan="5">Belum ada lemparan.</td></tr>') + "</tbody></table>" +
      '<p class="note">Riwayat maksimal lima percobaan terakhir. Tidak dijumlahkan: peluang dihitung dari banyaknya sisi.</p></div>' +
      "</div>" +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>Yang dicatat</b></div>' +
      '<p class="note">Satu percobaan = satu lemparan. Yang masuk lembar kerja adalah hasil lemparan itu, bukan frekuensi atau rata-rata.</p></div>' +
      "</div>" +
      "</main>" +
      '<footer class="cta">' +
      '<div class="code-card"><div><div class="lab">Kode laporan</div><div class="code" id="kodeTeks">' + kodeUntuk(id) + "</div></div>" +
      '<button class="copy" data-act="copy">Salin</button></div>' +
      (S.status(state, id) === "selesai" && id < 5
        ? '<button class="btn btn-primary" data-act="open" data-id="' + (id + 1) + '" style="margin-top:9px">Lanjut ke Bagian ' + K.forMisi(id + 1).kode + " &nbsp;→</button>" +
          '<div class="btn-row"><button class="mini-btn" data-act="back">Kembali ke lembar kerja</button></div>'
        : '<button class="btn btn-primary" data-act="back" style="margin-top:9px">Kembali ke lembar kerja</button>') +
      "</footer>" +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  function dataSebaran(r) {
    var p = S.peluang({ jenis: "angka", n: 6 });   /* data Misi A */
    return header({ back: true, title: "Papan Data", sub: "Bagian D · sebaran X dari Misi A", right: chip("✓ Bagian D") }) +
      '<main class="body wide">' +
      '<div class="toast">✓ <div><b>Bagian D:</b> tabel ini memakai hasil Misi A. Kolom ' + K.md("$P(X=x)$") + ' yang kamu isi di D1 harus sama dengan angka di kolom teori.</div></div>' +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>Sebaran teoretis</b><span>p = 1/6</span></div>' +
      '<table><thead><tr><th>x</th><th class="rt">peluang</th></tr></thead><tbody>' +
      '<tr><td>0</td><td class="n">' + dec(1 - p, 3) + " (" + pecahan(5, 6) + ")</td></tr>" +
      '<tr><td>1</td><td class="n">' + dec(p, 3) + " (" + pecahan(1, 6) + ")</td></tr>" +
      "</tbody></table>" +
      '<p class="note">Jumlah kedua peluang = 1.</p></div>' +
      "</div>" +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>Bentuk umum</b></div>' +
      '<p class="note">' + K.md("$P(X=x)=p^{x}(1-p)^{1-x}$ untuk $x=0$ dan $x=1$. Untuk $x=1$ hasilnya $p$; untuk $x=0$ hasilnya $1-p$.") + "</p>" +
      '<p class="note">Mengganti p (misalnya p = 1/2 dari aturan genap) hanya mengubah angka, bukan bentuk rumusnya.</p></div>' +
      "</div>" +
      "</main>" +
      '<footer class="cta"><button class="btn btn-primary" data-act="back">Kembali ke lembar kerja</button></footer>' +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  function renderData(id) {
    var r = S.rek(state, id);
    if (!papanSiap(id)) {
      var bk = K.forMisi(id).kode;
      return header({ back: true, title: "Papan Data", sub: "Bagian " + bk, right: chip("Bagian " + bk) }) +
        '<main class="body"><div class="locked-note">' +
        "Papan Data Bagian " + bk + " terbuka setelah percobaan bagian ini dilakukan." +
        '<br><button class="link" data-act="back">Kembali ke lembar kerja</button></div></main>' +
        '<footer class="cta"><div class="stack"><button class="btn btn-primary" data-act="back">' +
        "Kembali ke lembar kerja</button></div></footer>";
    }
    if (id === 4) return dataSebaran(r);
    return dataUmum(id, r);
  }

  /* ---------------- render ---------------- */
  function render() {
    var rt = route();
    S.sinkron(state);

    var kunci = rt.view + ":" + rt.id;
    var lama = document.querySelector(".body");
    var gulir = lama && kunci === ui.kunciRute ? lama.scrollTop : 0;
    if (kunci !== ui.kunciRute) ui.ringkas = false;

    if (rt.view === "home") $app.innerHTML = renderHome();
    else if (rt.view === "arena") $app.innerHTML = renderArena(rt.id);
    else $app.innerHTML = renderData(rt.id);
    K.renderMath($app);
    ui.pesan = null;

    var b = document.querySelector(".body");
    if (b) b.scrollTop = gulir;
    ui.kunciRute = kunci;
  }
  function force() { render(); }

  /* ---------------- aksi ---------------- */
  /* dipanggil sesudah satu butir LKM berubah */
  function setelahJawab(bt) {
    S.sinkron(state);
    S.simpan(state);
    if (bt && SN) SN.tandai(bt.id);
    var rt = route();
    var b = K.forMisi(rt.id);
    if (b) K.refresh(b.kode, state);
    refreshFooter();
  }

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute("data-jawab")) {
      setelahJawab(K.simpanInput(t, state));
      return;
    }
    if (t.dataset && t.dataset.ident) {
      state.peserta[t.dataset.ident] = t.value;
      S.simpan(state);
      if (SN && SN.identitas) SN.identitas();
      return;
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.id === "fileImpor" && e.target.files && e.target.files[0]) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          state = S.impor(String(reader.result));
          ui.pesan = "Progres dipulihkan.";
          go("#/");
        } catch (err) {
          ui.pesan = "Gagal memulihkan: " + err.message;
          force();
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  });

  window.addEventListener("hashchange", render);

  /* footer ringkas: isi lembar kerja digulir -> teks di bawah tombol disembunyikan */
  document.addEventListener("scroll", function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("body")) return;
    var ringkas = t.scrollTop > 24;
    if (ringkas === ui.ringkas) return;
    ui.ringkas = ringkas;
    var ft = document.querySelector("footer.cta");
    if (ft) ft.classList.toggle("ringkas", ringkas);
  }, true);

  /* ---------- reset / hapus data ----------
     Urutannya: antre kiriman dikosongkan -> server dibereskan -> perangkat dikosongkan.
     Kalau server gagal, pesan tidak boleh mengaku berhasil. */
  function tungguAntre() {
    var janji = (SN && SN.kosongkan) ? SN.kosongkan() : Promise.resolve(true);
    return Promise.race([janji, new Promise(function (r) { setTimeout(function () { r(false); }, 4000); })]);
  }

  function kosongkanServer() {
    if (!(A && A.aktif())) return Promise.resolve({ ok: false, server: false });
    return A.api("/api/peserta", { method: "POST", body: JSON.stringify({ mode: "kosongkan" }) })
      .then(function (r) { return { ok: !!(r && r.ok && r.data && r.data.ok), server: true }; })
      .catch(function () { return { ok: false, server: true }; });
  }

  function kosongkanData(jenis) {
    ui.pesan = "Menghapus data…";
    force();
    tungguAntre().then(kosongkanServer).then(function (hasil) {
      state = jenis === "reset" ? S.resetProgres() : S.resetSemua();
      if (SN && SN.kosongkan) SN.kosongkan();
      ui.sheet = null;
      ui.hapusLangkah = 0;
      if (hasil.ok) {
        ui.pesan = jenis === "reset"
          ? "Progres dihapus. Mulai lagi dari Misi 1."
          : "Semua data dihapus dari perangkat ini dan server.";
      } else if (hasil.server) {
        ui.pesan = "Progres di perangkat ini dihapus, tetapi server belum bisa dihubungi — salinan di server belum terhapus.";
      } else {
        ui.pesan = jenis === "reset"
          ? "Progres dihapus. Mulai lagi dari Misi 1."
          : "Semua data dihapus dari perangkat ini.";
      }
      go("#/");
    });
  }

  /* hapus permanen: identitas ikut hilang, jadi sesi server ditutup */
  function hapusDataSaya() {
    ui.pesan = "Menghapus data…";
    force();
    tungguAntre().then(function () {
      if (!(A && A.aktif())) return { ok: false, server: false, data: null };
      return A.api("/api/peserta", { method: "DELETE" }).then(function (r) {
        return { ok: !!(r && r.ok && r.data && r.data.ok), server: true, data: r && r.data };
      }).catch(function () { return { ok: false, server: true, data: null }; });
    }).then(function (hasil) {
      state = S.resetSemua();
      if (SN && SN.kosongkan) SN.kosongkan();
      ui.sheet = null;
      ui.hapusLangkah = 0;
      if (hasil.ok) {
        var n = hasil.data && hasil.data.jumlah
          ? (hasil.data.jumlah.jawaban || 0) + (hasil.data.jumlah.lemparan || 0) + (hasil.data.jumlah.peserta || 0)
          : 0;
        ui.pesan = "Data dihapus dari perangkat dan server." + (n ? " " + n + " baris server terhapus." : "");
        go("#/");
        A.keluar();
        return;
      }
      ui.pesan = hasil.server
        ? "Data di perangkat ini dihapus, tetapi server belum bisa dihubungi — salinan di server mungkin masih ada. Masuk lagi lalu ulangi \"Hapus data saya\"."
        : "Data dihapus dari perangkat ini.";
      go("#/");
    });
  }

  /* jawaban server digabung kalau perangkat ini belum punya (ganti perangkat) */
  function waktuIso(t) {
    var s = t ? String(t).trim() : "";
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(" ", "T") + "Z";
    return s;
  }

  /* Setelah reset/hapus, jawaban server yang lebih tua dari state.dibersihkan
     TIDAK boleh disalin balik — itu penyebab jawaban lama muncul lagi. */
  function gabungJawabanServer(sesi) {
    var srv = (sesi && sesi.jawabanServer) || {};
    var bersih = waktuIso(state.dibersihkan);
    var ubah = false;
    Object.keys(srv).forEach(function (id) {
      var jauh = srv[id];
      if (!jauh) return;
      var tsJauh = waktuIso(jauh.ts);
      /* jawaban versi lama (sebelum v4) memakai butir yang berbeda: buang.
         Tanggal ini disesuaikan dengan waktu deploy v4. */
      if (!tsJauh || tsJauh < "2026-11-05T00:00:00.000Z") return;
      if (bersih && tsJauh <= bersih) return;
      var lokal = state.jawaban[id];
      if (!lokal || tsJauh > waktuIso(lokal.ts)) {
        state.jawaban[id] = { v: jauh.v, ts: jauh.ts };
        ubah = true;
      }
    });
    if (sesi && sesi.nama && !state.peserta.nama) { state.peserta.nama = sesi.nama; ubah = true; }
    if (sesi && sesi.nim && !state.peserta.nim) { state.peserta.nim = sesi.nim; ubah = true; }
    if (sesi && sesi.kelas) { state.peserta.kelas = sesi.kelas; ubah = true; }
    if (ubah) S.simpan(state);
    return ubah;
  }

  /* ---------------- klik ---------------- */
  document.addEventListener("click", function (e) {
    if (A && A.pakaiGerbang() && !A.aktif()) return;

    var pil = e.target.closest("[data-pilih]");
    if (pil) {
      K.simpanInput(pil, state);
      var sod = pil.parentNode ? pil.parentNode.children : [];
      for (var i = 0; i < sod.length; i++) {
        sod[i].classList.toggle("on", sod[i] === pil);
        sod[i].setAttribute("aria-pressed", String(sod[i] === pil));
      }
      setelahJawab(K.butirById(pil.getAttribute("data-jawab")));
      return;
    }

    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    var id = parseInt(el.getAttribute("data-id"), 10) || route().id;

    if (el.classList.contains("overlay") && e.target !== el) return;

    switch (act) {
      case "home": go("#/"); break;
      case "open": go("#/misi/" + id); break;
      case "back": {
        var cur = route();
        if (cur.view === "data") go("#/misi/" + cur.id);
        else go("#/");
        break;
      }
      case "data":
        if (!papanSiap(id)) { force(); break; }
        go("#/misi/" + id + "/data");
        break;
      case "lempar": {
        if (!bisaLempar(id)) { force(); break; }
        S.lempar(state, id);
        var d = document.querySelector(".die");
        if (d) d.classList.add("rolling");
        setTimeout(force, 260);
        break;
      }
      case "coba-lagi":
        /* jangan lempar lagi: beri pengertian dulu, lalu gulir ke kartunya */
        ui.cobaLagi = true;
        force();
        setTimeout(function () {
          var n = document.getElementById("notisUlang");
          if (n) n.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 80);
        break;
      case "tutup-notis":
        ui.cobaLagi = false;
        force();
        break;
      case "ulangi":
        S.ulangi(state, id);
        ui.cobaLagi = false;
        force();
        break;
      case "pilih-aturan": {
        var at = aturanDariKunci(el.getAttribute("data-kunci"));
        if (at) S.pilihAturan(state, id, at);
        force();
        break;
      }
      case "e-jenis": {
        var jenis = el.getAttribute("data-jenis");
        var lama = S.rek(state, 5).aturan || {};
        var at5 = { jenis: jenis };
        if (jenis === "angka") at5.n = lama.jenis === "angka" ? lama.n : (ui.eN || 6);
        if (jenis === "min") at5.n = lama.jenis === "min" ? lama.n : 5;
        if (jenis === "maks") at5.n = lama.jenis === "maks" ? lama.n : 2;
        S.pilihAturan(state, 5, at5);
        force();
        break;
      }
      case "e-n": {
        var r5 = S.rek(state, 5);
        var a5 = r5.aturan || { jenis: "angka", n: 6 };
        var d5 = parseInt(el.getAttribute("data-d"), 10) || 0;
        var batas = a5.jenis === "angka" ? [1, 6] : (a5.jenis === "min" ? [2, 6] : [1, 5]);
        var n5 = Math.max(batas[0], Math.min(batas[1], (a5.n || batas[0]) + d5));
        a5.n = n5;
        ui.eN = n5;
        S.pilihAturan(state, 5, a5);
        force();
        break;
      }
      case "copy": {
        var kode = (document.getElementById("kodeTeks") || {}).textContent || "";
        if (navigator.clipboard) navigator.clipboard.writeText(kode);
        ui.pesan = "Kode " + kode + " disalin.";
        force();
        break;
      }
      case "export": {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([S.ekspor(state)], { type: "application/json" }));
        a.download = "progres-misi-dadu.json";
        a.click();
        break;
      }
      case "import": {
        var f = document.getElementById("fileImpor");
        if (f) f.click();
        break;
      }
      case "papan-buka": {
        var idp = parseInt(el.getAttribute("data-id"), 10) || 1;
        ui.sheet = null;
        go("#/misi/" + idp + "/data");
        break;
      }
      case "reset-open": ui.sheet = "reset"; force(); break;
      case "tentang": ui.sheet = "tentang"; force(); break;
      case "keluar": ui.sheet = null; A.keluar(); break;
      case "hapus-open": ui.sheet = "hapus"; ui.hapusLangkah = 1; force(); break;
      case "hapus-siap": ui.hapusLangkah = 2; force(); break;
      case "hapus-konfirm": hapusDataSaya(); break;
      case "sinkron": if (SN) { SN.kirim(); ui.pesan = "Mengirim jawaban yang tertunda…"; force(); } break;
      case "reset-confirm": kosongkanData("reset"); break;
      case "reset-all": kosongkanData("semua"); break;
      case "sheet-close": ui.sheet = null; force(); break;
      case "sheet-stop": break;
    }
  });

  A.mulai(function (sesi) {
    if (sesi && sesi.mode === "server") gabungJawabanServer(sesi);
    S.sinkron(state);
    if (!location.hash) location.replace("#/");
    render();
    if (SN) SN.mulai();
  });
})();
