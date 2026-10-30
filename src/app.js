/* =========================================================
   app.js — router, layar, dan interaksi Misi Dadu
   Semua state disimpan lewat Store; render ulang setelah aksi.
   ========================================================= */
(function () {
  "use strict";

  var S = window.Store;
  var C = window.Charts;
  var L = window.Laporan;
  var K = window.LKM;
  var A = window.Auth;
  var SN = window.Sinkron;

  function masukServer() { return !!(A && A.aktif()); }
  function labelSesi() { return A && A.label ? A.label() : ""; }

  var state = S.baca();
  var ui = { sheet: null, sheetMisi: null, pesan: null, salah: null, m5nama: "" };

  var $app = document.getElementById("app");

  /* ---------------- util ---------------- */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dec(x, d) { return Number(x).toFixed(d === undefined ? 3 : d).replace(".", ","); }
  function pct(x) { return Math.round(x * 100); }

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
  function pips(v) {
    var pos = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    var on = pos[v] || pos[1];
    var out = "";
    for (var i = 1; i <= 9; i++) out += '<i class="' + (on.indexOf(i) >= 0 ? "" : "off") + '"></i>';
    return out;
  }
  function dieHTML(v) {
    return '<div class="die" role="img" aria-label="Dadu menunjukkan ' + v + '">' + pips(v) + "</div>";
  }
  function chip(txt, tone) {
    return '<span class="chip ' + (tone || "") + '">' + txt + "</span>";
  }
  function pLabel() {
    return (S.status(state, 2) === "selesai" || K.jawabanLengkap("B", state)) ? "$\\hat p$" : "$k \\,/\\, n$";
  }
  function statsHTML(h, label, tanpaN) {
    return '<div class="stats' + (tanpaN ? " two" : "") + '">' +
      (tanpaN ? "" : '<div class="stat"><span>n</span><b>' + h.n + "</b></div>") +
      '<div class="stat"><span>k</span><b>' + h.k + "</b></div>" +
      '<div class="stat accent"><span>' + K.md(label || pLabel()) + '</span><b>' + dec(h.phat, 3) + "</b></div>" +
      "</div>";
  }
  function kodeUntuk(id) {
    var r = S.rek(state, id);
    var h = id === 4 ? S.hitung(r.rules[1] || [], 1) : S.hitung(r.rolls, r.aturan);
    try {
      return L.encode({ misi: id, aturan: id === 4 ? 1 : r.aturan, n: Math.min(h.n, 1023), k: Math.min(h.k, 1023) });
    } catch (e) { return "—"; }
  }

  /* ---------------- header ---------------- */
  function header(opts) {
    opts = opts || {};
    var left = opts.back
      ? '<button class="back" data-act="back" aria-label="Kembali">←</button>'
      : '<div class="mark" aria-hidden="true">⚄</div>';
    return '<header class="bar">' +
      left +
      '<div class="brand">' +
      '<div><div class="brand-name">' + (opts.title || "Ruang Bernoulli") + "</div>" +
      '<div class="brand-sub"><span>' + (opts.sub || "Misi Dadu") + "</span>" +
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
        : "Satu dadu bersisi enam, lima bagian. Konsepnya kamu temukan sendiri lewat percobaan; materi menyusul setelah lembar kerjanya selesai.");

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

    var tujuan = '<div class="panel"><div class="panel-head"><b>Tujuan pembelajaran</b></div>' +
      '<ol class="steps tujuan-list">' +
      "<li>" + K.md("Membedakan percobaan Bernoulli dari percobaan biasa dan menuliskan peubah indikatornya.") + "</li>" +
      "<li>" + K.md("Membedakan statistik $\\hat p$ dan parameter $p$, lalu menghitung keduanya dari data lemparan.") + "</li>" +
      "<li>" + K.md("Menjelaskan hukum bilangan besar lewat grafik $\\hat p$ terhadap $n$ dan menaksir simpangan wajarnya.") + "</li>" +
      "<li>" + K.md("Menurunkan penduga $p$ dari fungsi likelihood dan mengaitkannya ke sebaran Binomial.") + "</li>" +
      "</ol></div>";

    var petunjuk = '<div class="panel"><div class="panel-head"><b>Petunjuk umum</b></div>' +
      '<ol class="steps">' +
      "<li>Kerjakan berurutan dari Bagian A sampai E; setiap bagian terbuka setelah bagian sebelumnya selesai.</li>" +
      "<li>Jawab butir <b>prediksi</b> sebelum menekan tombol lempar — tebakan awal tidak dinilai, tetapi perlu.</li>" +
      "<li>Isi lembar kerja lebih dulu. <b>Materi</b> di akhir bagian baru terbuka setelah semua butir bagian itu terjawab.</li>" +
      "<li>Setiap kali lemparan pada satu bagian habis, buka <b>Papan Data</b> untuk melihat rekapan seluruh lemparan bagian itu.</li>" +
      "<li>Jumlah lemparan tiap bagian dibatasi supaya hasilnya bukan percobaan tanpa batas.</li>" +
      "</ol></div>";

    return header({
      title: "Ruang Bernoulli",
      sub: "LKM digital · Statistika Matematika",
      right: chip(selesai + " / 5 bagian")
    }) +
      '<main class="body">' +
      '<div class="hero"><div class="eyebrow">Lembar Kerja Mahasiswa · Distribusi Bernoulli</div>' +
      '<h2 class="title">' + esc(judul) + "</h2>" +
      '<p class="sub">' + sub + "</p></div>" +
      segbar() +
      ident + tujuan + petunjuk +
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

  var TIM = [
    ["Ahmad As Siddiq", "06081282429062"],
    ["Annisa Putri S.", "06081282429036"],
    ["Fathia Aiva", "06081382429083"],
    ["Sherin Az Zahra", "06081382429085"]
  ];

  function sheetTentang() {
    var tim = TIM.map(function (t, i) {
      return '<li><span class="nm">' + esc(t[0]) + '</span><span class="nim">' + esc(t[1]) + "</span></li>";
    }).join("");
    return '<div class="overlay" data-act="sheet-close">' +
      '<div class="sheet tentang" data-stop="1">' +
      '<div class="eyebrow">Tentang media</div>' +
      '<h4>Ruang Bernoulli: Misi Dadu</h4>' +
      '<div class="divider"></div>' +
      '<div class="eyebrow">Tim pengembang · Kelompok 9</div>' +
      '<ol class="tim">' + tim + "</ol>" +
      '<div class="inst">' +
      "PROGRAM STUDI PENDIDIKAN MATEMATIKA<br>" +
      "FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN<br>" +
      "UNIVERSITAS SRIWIJAYA<br>" +
      '<span class="tahun">2026</span>' +
      "</div>" +
      (masukServer()
      ? '<div class="acts" style="margin-top:12px"><button class="b2" data-act="keluar">Keluar dari sesi</button></div>'
      : "") +
      '<button class="b2" data-act="sheet-close" style="margin-top:12px;width:100%">Tutup</button>' +
      "</div></div>";
  }

  function sheetHTML() {
    if (ui.sheet === "reset") return sheetReset();
    if (ui.sheet === "tentang") return sheetTentang();
    if (ui.sheet === "hapus") return sheetHapus();
    return "";
  }

  /* hapus data: dua langkah, dan server benar-benar menghapus barisnya */
  function sheetHapus() {
    if (ui.hapusLangkah === 2) {
      return '<div class="overlay" data-act="sheet-close"><div class="sheet" data-stop="1">' +
        "<h4>Hapus permanen?</h4>" +
        "<p>Jawaban, lemparan, dan identitasmu akan dihapus dari <b>perangkat ini dan server</b>. " +
        "Pengembang tidak bisa memulihkannya. Kode laporan yang sudah kamu salin tetap berlaku sebagai angka, " +
        "tetapi tidak lagi terhubung ke namamu.</p>" +
        '<div class="acts"><button class="b1" data-act="hapus-konfirm">Ya, hapus permanen</button>' +
        '<button class="b2" data-act="sheet-close">Batal</button></div>' +
        "</div></div>";
    }
    return '<div class="overlay" data-act="sheet-close"><div class="sheet" data-stop="1">' +
      "<h4>Hapus data saya</h4>" +
      "<p>Semua jawaban dan progres di perangkat ini akan dihapus. Kalau kamu masuk dengan kode akses, " +
      "data yang sudah terkirim ke server juga ikut dihapus.</p>" +
      '<div class="acts"><button class="b1" data-act="hapus-siap">Lanjut</button>' +
      '<button class="b2" data-act="sheet-close">Batal</button></div></div></div>';
  }

  function sheetReset() {
    return '<div class="overlay" data-act="sheet-close">' +
      '<div class="sheet" data-stop="1">' +
      "<h4>Mulai ulang dari awal?</h4>" +
      "<p>Semua lemparan, jawaban lembar kerja, dan progres lima bagian di perangkat ini akan dihapus. Kode laporan yang sudah kamu salin di tempat lain tidak terpengaruh.</p>" +
      '<div class="acts">' +
      '<button class="b1" data-act="reset-confirm">Ya, hapus progres</button>' +
      '<button class="b2" data-act="sheet-close">Batal</button>' +
      "</div>" +
      '<button class="link warn tiny" data-act="reset-all">Hapus semua termasuk nama &amp; email</button>' +
      "</div></div>";
  }

  /* ---------------- ARENA (satu bagian LKM) ---------------- */
  function renderArena(id) {
    var m = S.def(id);
    var b = K.forMisi(id);
    var r = S.rek(state, id);
    var st = S.status(state, id);
    var isi = "";

    if (st === "terkunci") {
      isi = '<div class="locked-note">Bagian ini terbuka setelah Bagian ' + K.forMisi(id - 1).kode +
        " selesai. <br><button class=\"link\" data-act=\"home\">Kembali ke sampul</button></div>";
    } else if (id === 1) {
      isi = arenaM1(r);
    } else if (id === 2) {
      isi = arenaM2(r);
    } else if (id === 3) {
      isi = arenaM3(r);
    } else if (id === 4) {
      isi = arenaM4(r);
    } else {
      isi = arenaM5(r);
    }

    var lkm = st === "terkunci" ? "" :
      K.renderPra(b.kode, state) + isi + K.renderPanel(b.kode, state);

    return header({
      back: true,
      title: b.judul,
      sub: "Bagian " + b.kode + " · Misi " + id,
      right: chip("Bagian " + b.kode)
    }) +
      '<main class="body ' + (id === 3 || id === 5 ? "wide" : "") + '">' + lkm + "</main>" +
      footerArena(id) +
      sheetHTML() +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  /* ---------------- instruksi & penutup bagian ---------------- */
  /* Teks instruksi tidak boleh memuat rumus atau nama konsep yang
     belum ditemukan siswa (lihat TASKS §2.4). */
  var INSTRUKSI = {
    1: {
      ringkas: "lima lemparan",
      tujuan: "Tujuan: mengubah hasil lemparan dadu menjadi dua angka saja, 1 dan 0.",
      langkah: [
        "Isi butir <b>prediksi</b> lebih dulu, sebelum melempar: tulis satu bilangan bulat <b>0 sampai 5</b> (berapa kali kamu menduga angka 6 muncul).",
        "Tekan <b>Lempar dadu</b> lima kali. Kotak dadu besar menunjukkan hasil terakhir.",
        "Tabel Bagian A terisi otomatis (angka dadu + S/G), lalu jawab pertanyaan sesudahnya.",
        "Setelah lima lemparan habis, buka <b>Papan Data</b> untuk melihat rekapan seluruh lemparan bagian ini."
      ]
    },
    2: {
      ringkas: "sepuluh lemparan",
      tujuan: "Tujuan: membuat sendiri kolom jumlah sukses dan kolom pembagiannya dari data lemparanmu.",
      langkah: [
        "Tekan <b>Lempar dadu</b> sepuluh kali; kamu boleh berhenti di tengah dan melanjutkan nanti.",
        "Buka <b>Papan Data</b>: di sana ada seluruh sepuluh angka dadu urut dari lemparan ke-1. Pakai halaman itu untuk mengisi kolom $X_i$, $k_i$, dan $k_i/i$.",
        "Bandingkan kolom terakhir dengan peluang yang kamu temukan di Bagian A."
      ]
    },
    3: {
      ringkas: "seratus lemparan",
      tujuan: "Tujuan: melihat apa yang terjadi pada proporsi sukses ketika jumlah lemparan bertambah.",
      langkah: [
        "Isi butir <b>prediksi</b> dulu: satu bilangan bulat <b>0 sampai 100</b> (berapa kali angka 6 muncul dari seratus lemparan). Angka itu membuka tombol Lempar 100×.",
        "Setelah seratus lemparan selesai, grafik $\\hat p$ terhadap $n$ muncul di panel kanan: sumbu datar = $n$, sumbu tegak = $\\hat p$.",
        "Grafik menandai enam titik dengan garis putus-putus (n = 10, 20, 40, 60, 80, 100) dan nilai $\\hat p$ di tiap titik. Salin keenam nilai itu ke butir C2.",
        "Buka <b>Papan Data</b> Bagian C untuk rekapan seluruh lemparan bila perlu memeriksa."
      ]
    },
    4: {
      ringkas: "tiga aturan · 180 lemparan",
      tujuan: "Tujuan: mencari nilai p yang paling masuk akal untuk data yang sudah kamu kumpulkan.",
      langkah: [
        "Pilih aturan sukses di atas — <b>6 saja</b> (|A| = 1), <b>≥ 5</b> (|A| = 2), atau <b>≥ 4</b> (|A| = 3) — lalu tekan <b>Lempar 60×</b>. Ulangi sampai ketiga aturan penuh 60 lemparan.",
        "Isi tabel butir D1 (<b>p</b> dan <b>E[X]</b>) untuk ketiga aturan: p dalam desimal tiga angka (contoh <b>0,167</b>).",
        "Buka <b>Papan Data</b> Bagian D untuk rekapan n, k, dan $\\hat p$ tiap aturan."
      ]
    },
    5: {
      ringkas: "gabungan data kelas",
      tujuan: "Tujuan: membandingkan dua cara menggabungkan data beberapa orang.",
      langkah: [
        "Isi tabel data di panel atas: <b>n</b> dan <b>k</b> dari Papan Data Bagian C temanmu. Tidak punya teman di sekitar? Pilih <b>Simulasi kelas</b> lalu tekan tombol isi.",
        "Datamu sendiri (n dan k dari Bagian C) sudah otomatis ikut, jadi ada empat baris data.",
        "Kerjakan butir E1: <b>gabungan</b> = semua k dijumlah lalu dibagi semua n; <b>rata-rata</b> = $\\hat p$ tiap baris ($k \\div n$) dijumlah lalu dibagi empat.",
        "Buka <b>Papan Data</b> Bagian E untuk melihat data yang digabungkan."
      ]
    }
  };

  function instruksiBox(id) {
    var d = INSTRUKSI[id];
    /* langkah boleh memuat **tebal** dan $rumus$; tag <b> lama diubah dulu
       supaya lolos md() tanpa ikut ter-escape */
    var li = d.langkah.map(function (t) {
      return "<li>" + K.md(String(t).replace(/<\/?b>/g, "**")) + "</li>";
    }).join("");
    return '<div class="panel instruksi" data-stop="1">' +
      '<div class="panel-head"><b>Bagian ' + K.forMisi(id).kode + " · Misi " + id + "</b><span>" + d.ringkas + "</span></div>" +
      '<p class="tujuan">' + d.tujuan + "</p>" +
      '<ol class="steps">' + li + "</ol></div>";
  }

  function selesaiCard(id, r, opts) {
    opts = opts || {};
    var b = K.forMisi(id);
    var j = K.jumlahTerisi(b.kode, state);
    var nextHint = id < 5
      ? "Bagian " + K.forMisi(id + 1).kode + " sudah terbuka. Lanjutkan lewat tombol di bawah."
      : "Semua bagian selesai. Baca ulang materi kapan saja, atau kembali ke sampul untuk melihat ringkasan.";
    return '<div class="selesai"><div class="eyebrow">✓ Bagian ' + b.kode + " selesai</div>" +
      "<h4>" + esc(b.judul) + "</h4>" +
      '<ol class="steps">' +
      "<li>Percobaan pada bagian ini sudah memenuhi batas lemparan.</li>" +
      "<li>Semua " + j.total + " butir lembar kerja sudah terjawab.</li>" +
      "<li><b>Buka Papan Data Bagian " + b.kode + "</b> untuk melihat rekapan seluruh lemparan" +
      (id === 4 ? " ketiga aturan" : "") + " dan kode laporan.</li>" +
      "<li>Materi Bagian " + b.kode + " ada di halaman bagian itu — bacalah untuk memeriksa jawabanmu.</li>" +
      "</ol>" +
      (opts.papan ? "" : '<div class="btn-row"><button class="mini-btn" data-act="data" data-id="' + id +
        '">Buka Papan Data Bagian ' + b.kode + " →</button></div>") +
      '<p class="next-hint">' + nextHint + "</p></div>";
  }

  function arenaM1(r) {
    var h = S.hitung(r.rolls, r.aturan);
    var last = r.rolls.length ? r.rolls[r.rolls.length - 1] : 6;
    var penuh = h.n >= 5;
    return instruksiBox(1) +
      '<div class="die-stage">' + dieHTML(last) + "</div>" +
      statsHTML(h, null, true) +
      '<div class="panel"><div class="panel-head"><b>Aturan pencatatan</b><span>sukses = muncul 6</span></div>' +
      '<p class="note">Muncul <b>6</b> → sukses, ditulis <b>X = 1</b>. Selain 6 → gagal, ditulis <b>X = 0</b>.</p>' +
      '<div class="chips"><span class="tag">' + h.k + " sukses</span>" +
      '<span class="tag">' + (h.n - h.k) + " gagal</span>" +
      '<span class="tag">p = 1/6 ≈ 0,167</span></div></div>' +
      (penuh ? selesaiCard(1, r) : "");
  }

  function arenaM2(r) {
    var h = S.hitung(r.rolls, r.aturan);
    var last = r.rolls.length ? r.rolls[r.rolls.length - 1] : 6;
    var penuh = h.n >= 10;
    return instruksiBox(2) +
      '<div class="die-stage">' + dieHTML(last) + "</div>" +
      statsHTML(h, null, true) +
      '<div class="panel"><div class="panel-head"><b>Rekapan lemparan</b><span>' + h.n + "/10 lemparan</span></div>" +
      '<p class="note">' + K.md("Tabel hasil percobaan tidak ditampilkan di halaman ini. Buka **Papan Data** (tombol di bawah) untuk melihat seluruh angka dadu beserta kolom $X_i$, $k_i$, dan $k_i/i$.") + "</p></div>" +
      (penuh ? selesaiCard(2, r) : "");
  }

  function arenaM3(r) {
    var h = S.hitung(r.rolls, r.aturan);
    var last = r.rolls.length ? r.rolls[r.rolls.length - 1] : 6;
    var pred = r.prediksi;
    var penuh = h.n >= 100;
    var predCard = (pred === null || pred === undefined)
      ? '<div class="predict"><div class="q">Isi butir <b>prediksi</b> di lembar kerja di bawah. Angka itu membuka tombol 100 lemparan.</div></div>'
      : '<div class="predict done"><div class="q">Tebakanmu: <b>' + pred + " kali</b>" +
        (penuh ? " · hasil: <b>" + h.k + " kali</b>" : " · belum dijalankan") + "</div></div>";
    return instruksiBox(3) +
      '<div class="colstack">' +
      '<div class="die-stage">' + dieHTML(last) + "</div>" + predCard +
      "</div>" +
      '<div class="colstack">' +
      statsHTML(h) +
      '<div class="panel"><div class="panel-head"><b>Proporsi terhadap jumlah lemparan</b><span>' +
      K.md("$\\hat p$ terhadap $n$") + "</span></div>" +
      C.konvergensi(r.rolls, r.aturan, 1 / 6) +
      '<p class="note">' + K.md("Titik bulat dengan garis putus-putus menandai n = 10, 20, 40, 60, 80, 100; nilai $\\hat p$ di titik itu tertulis di sebelahnya — itulah yang kamu salin ke butir C2.") + "</p></div>" +
      "</div>" +
      (penuh ? selesaiCard(3, r) : "");
  }

  function arenaM4(r) {
    var aturanAktif = ui.rule || 1;
    var baris = [1, 2, 3].map(function (a) {
      var arr = r.rules[a] || [];
      var h = S.hitung(arr, a);
      return { a: a, label: a === 1 ? "6" : (a === 2 ? "5–6" : "4–6"), p: a / 6, n: h.n, k: h.k, phat: h.phat };
    });
    var tabs = [1, 2, 3].map(function (a) {
      return '<button class="tab ' + (a === aturanAktif ? "on" : "") + '" data-act="rule" data-a="' + a + '">' +
        (a === 1 ? "6 saja" : a === 2 ? "≥ 5" : "≥ 4") + "</button>";
    }).join("");
    var aktifBaris = baris.filter(function (b) { return b.a === aturanAktif; })[0];
    var aturanPenuh = aktifBaris.n >= 60;
    var semuaPenuh = baris.every(function (b) { return b.n >= 60; });
    return instruksiBox(4) +
      '<div class="tabs">' + tabs + "</div>" +
      '<div class="panel"><div class="panel-head"><b>Aturan aktif: ' +
      (aturanAktif === 1 ? "muncul 6" : aturanAktif === 2 ? "muncul 5 atau 6" : "muncul 4, 5, atau 6") +
      "</b><span>p = " + dec(aktifBaris.p, 3) + " · " + aktifBaris.n + "/60</span></div>" +
      '<p class="note">' + (aturanPenuh ? "Aturan ini sudah 60 lemparan. Pilih aturan lain di atas, atau ulangi aturan ini."
        : "Tersisa " + (60 - aktifBaris.n) + " lemparan untuk aturan ini.") + "</p>" +
      '<div class="btn-row"><button class="btn btn-primary sm" data-act="roll60"' + (aturanPenuh ? " disabled" : "") + ">" +
      "Lempar 60× · aturan ini</button>" +
      '<button class="btn btn-ghost sm" data-act="rule-reset">Ulangi aturan ini</button></div></div>' +
      '<div class="panel"><div class="panel-head"><b>Peluang teoretis tiap aturan</b><span>' +
      K.md("$p = \\dfrac{|A|}{6}$") + "</span></div>" +
      C.aturanBars(baris.map(function (b) { return { label: b.label, p: b.p }; })) +
      '<p class="note">' + K.md("Rekapan $n$, $k$, dan $\\hat p$ ketiga aturan ada di **Papan Data Bagian D** — tabelnya sengaja hanya di halaman itu.") + "</p></div>" +
      (semuaPenuh ? selesaiCard(4, r) : "");
  }

  /* ---- Misi 5: data teman (manual) atau simulasi kelas ---- */
  /* n sengaja berbeda supaya Σk/Σn ≠ rata-rata p̂ — kalau semua n sama,
     poin inti misi (pembobotan ukuran sampel) hilang. */
  var SIM_N = [60, 80, 120];

  function binomialK(n, p) {
    var k = 0;
    for (var i = 0; i < n; i++) if (Math.random() < p) k++;
    return k;
  }
  function buatSimulasi() {
    return SIM_N.map(function (n) { return { n: n, k: binomialK(n, 1 / 6) }; });
  }
  function m5Baris(r) { return r.mode === "simulasi" ? (r.sim || []) : (r.teman || []); }
  function m5Simulasi(r) { return r.mode === "simulasi"; }
  /* simulasi hanya diisi setelah siswa menekan "Isi data simulasi" —
     jangan pernah mengisi otomatis saat mode diganti, siswa harus sempat
     membaca dulu apa itu data simulasi. */
  function m5SimSiap(r) { return m5Simulasi(r) && (r.sim || []).length > 0; }

  function m5ModeBar(r) {
    var sim = m5Simulasi(r);
    return '<div class="segc" role="group" aria-label="Sumber data Misi 5">' +
      '<button data-act="m5mode" data-mode="teman" class="' + (sim ? "" : "on") + '" aria-pressed="' + (!sim) + '">Data teman</button>' +
      '<button data-act="m5mode" data-mode="simulasi" class="' + (sim ? "on" : "") + '" aria-pressed="' + sim + '">Simulasi kelas</button>' +
      "</div>";
  }

  function arenaM5(r) {
    var d = m5Data(r);
    var sim = m5Simulasi(r);
    var simSiap = m5SimSiap(r);
    var baris = "";

    if (sim && !simSiap) {
      /* mode simulasi dipilih tapi belum diisi: tabel tetap ditampilkan
         sebagai pratinjau kosong, isinya baru muncul setelah tombol ditekan. */
      var kosong = [0, 1, 2].map(function (i) {
        return '<tr><td>' + (i + 1) + "</td>" +
          '<td><span class="simp">simulasi</span></td>' +
          '<td class="n">—</td><td class="n">—</td></tr>';
      }).join("");
      return instruksiBox(5) +
        '<div class="panel"><div class="panel-head"><b>Data tiga teman</b><span>belum diisi</span></div>' +
        m5ModeBar(r) +
        '<p class="note">Mode <b>Simulasi kelas</b> mengisi tabel dengan hasil pengacakan <b>60, 80, dan 120 lemparan dadu</b> (peluang sukses 1/6). n-nya sengaja berbeda supaya Σk/Σn dan rata-rata p̂ tidak sama — itu poin inti misi ini.</p>' +
        '<p class="note">Angka ini <b>bukan teman sekelas</b>. Pakai kalau kamu mengerjakan sendiri, dan tulis asal datanya di butir E2.</p>' +
        '<table><thead><tr><th>#</th><th>sumber</th><th class="rt">n</th><th class="rt">k</th></tr></thead><tbody>' +
        kosong + "</tbody></table>" +
        '<div class="btn-row"><button class="mini-btn" data-act="m5isi">Isi data simulasi</button></div>' +
        '<p class="note">Belum yakin? Kembali ke <b>Data teman</b> di atas kalau kamu punya kode laporan Misi 3 temanmu.</p></div>';
    }

    if (sim) {
      (r.sim || []).forEach(function (t, i) {
        baris += '<tr><td>' + (i + 1) + "</td>" +
          '<td><span class="simp">simulasi</span></td>' +
          '<td class="n">' + t.n + "</td>" +
          '<td class="n">' + t.k + "</td></tr>";
      });
    } else {
      for (var i = 0; i < 3; i++) {
        var t = (r.teman || [])[i] || { nama: "", n: "", k: "" };
        baris += '<tr><td>' + (i + 1) + "</td>" +
          '<td><input class="inp" data-m5="nama" data-i="' + i + '" value="' + esc(t.nama) + '" placeholder="nama" aria-label="Nama teman ' + (i + 1) + '"></td>' +
          '<td><input class="inp num" data-m5="n" data-i="' + i + '" inputmode="numeric" value="' + esc(t.n) + '" placeholder="n" aria-label="n teman ' + (i + 1) + '"></td>' +
          '<td><input class="inp num" data-m5="k" data-i="' + i + '" inputmode="numeric" value="' + esc(t.k) + '" placeholder="k" aria-label="k teman ' + (i + 1) + '"></td></tr>';
      }
    }

    return instruksiBox(5) +
      '<div class="panel"><div class="panel-head"><b>Data tiga teman</b><span>' +
      (sim ? "data simulasi · n berbeda" : "isi n dan k dari kode laporan Misi 3 mereka") + "</span></div>" +
      m5ModeBar(r) +
      '<p class="note">' + (sim
        ? "Baris ini <b>data simulasi</b>, bukan teman sungguhan — dipakai kalau kamu mengerjakan sendiri. Tulis asal datanya di butir E2."
        : "Isi <b>n</b> dan <b>k</b> dari Papan Data Misi 3 temanmu. Mengisi sendiri? Pilih <b>Simulasi kelas</b> di atas.") + "</p>" +
      '<table><thead><tr><th>#</th><th>' + (sim ? "sumber" : "nama") + '</th><th class="rt">n</th><th class="rt">k</th></tr></thead><tbody>' +
      baris + "</tbody></table>" +
      (sim ? '<div class="btn-row"><button class="mini-btn" data-act="m5acak">Acak ulang data simulasi</button></div>' +
        '<p class="note">Angka berubah setiap kali diacak — kalau tabelnya sudah kamu salin ke lembar kerja, perbarui salinannya.</p>' : "") +
      '<p class="note">Data kamu sendiri: n = ' + d.mineN + ", k = " + d.mineK + " — otomatis ikut dihitung.</p></div>" +
      '<div class="stats" id="m5stats">' + m5Stats(r) + "</div>" +
      '<div class="panel" id="m5notes">' + m5Notes(r) + "</div>" +
      '<div id="m5tutup">' + m5Tutup(r) + "</div>";
  }

  /* kartu penutup misi 5: ikut berubah saat baris diisi (tanpa render ulang) */
  function m5Tutup(r) {
    if (m5Lengkap(r)) {
      /* tanpa popup otomatis: tombol papan data muncul di sini, jadi siswa
         sempat membaca catatan data simulasi sebelum pindah halaman */
      return selesaiCard(5, r) +
        '<div class="btn-row"><button class="mini-btn" data-act="data">Buka Papan Data Misi 5 →</button></div>';
    }
    if (S.status(state, 5) === "selesai") {
      return '<div class="toast">✓ <div><b>Misi 5 sudah selesai.</b> Mode yang aktif sekarang masih kosong — mengisinya akan mengganti angka pada laporan.</div></div>';
    }
    return '<p class="note center">Isi ketiga baris untuk menyelesaikan misi ini.</p>';
  }

  function m5Data(r) {
    var teman = m5Baris(r);
    var valid = teman.filter(function (t) { return Number(t.n) > 0 && Number(t.k) >= 0 && Number(t.k) <= Number(t.n); });
    var sn = valid.reduce(function (a, t) { return a + Number(t.n); }, 0);
    var sk = valid.reduce(function (a, t) { return a + Number(t.k); }, 0);
    var r3 = S.rek(state, 3);
    var mine = S.hitung(r3.rolls, r3.aturan);
    var totalN = sn + mine.n, totalK = sk + mine.k;
    var rata = valid.length ? valid.reduce(function (a, t) { return a + Number(t.k) / Number(t.n); }, 0) / valid.length : 0;
    return {
      valid: valid,
      mineN: mine.n,
      mineK: mine.k,
      totalN: totalN,
      totalK: totalK,
      pGab: totalN ? totalK / totalN : 0,
      rata: rata,
      se: totalN ? Math.sqrt((1 / 6) * (5 / 6) / totalN) : 0,
      nTeman: valid.length,
      simulasi: m5Simulasi(r)
    };
  }
  function m5Lengkap(r) { return m5Data(r).valid.length >= 3; }

  function m5Stats(r) {
    var d = m5Data(r);
    var buka = S.adaJawaban(state, "E1");
    return '<div class="stat"><span>' + K.md("$\\Sigma n$") + "</span><b>" + d.totalN + "</b></div>" +
      '<div class="stat"><span>' + K.md("$\\Sigma k$") + "</span><b>" + d.totalK + "</b></div>" +
      (buka
        ? '<div class="stat accent"><span>' + K.md("$\\hat p$ gabungan") + "</span><b>" + dec(d.pGab, 4) + "</b></div>"
        : '<div class="stat"><span>baris</span><b>' + d.valid.length + "/3</b></div>");
  }

  function m5Notes(r) {
    var d = m5Data(r);
    var buka = S.adaJawaban(state, "E1");
    var head = '<div class="panel-head"><b>Dua cara menggabungkan</b><span>' +
      (buka ? "p = 0,1667" : "hitung sendiri dulu") + "</span></div>";
    var dasar = '<p class="note">' + K.md("Cara pertama: jumlahkan semua $k$ lalu bagi dengan jumlah semua $n$. " +
      "Cara kedua: hitung $\\hat p$ tiap orang, lalu rata-ratakan keempatnya. " +
      (buka ? "" : "Angka pembandingnya muncul setelah butir **E1** terjawab.")) + "</p>";
    var sumber = '<p class="note">' + d.valid.length + " dari tiga baris terisi" +
      (d.simulasi ? " · <b>data simulasi</b>, bukan teman" : "") + " · datamu sendiri (Bagian C): n = " +
      d.mineN + ", k = " + d.mineK + ".</p>";
    if (!buka) return head + dasar + sumber;
    var gap = Math.abs(d.pGab - 1 / 6);
    return head + dasar +
      '<p class="note">' + K.md("Gabungan $\\dfrac{\\Sigma k}{\\Sigma n}$") + " = <b>" + dec(d.pGab, 4) +
      "</b> · " + K.md("rata-rata $\\hat p$") + " = <b>" + dec(d.rata, 4) + "</b> · selisih = <b>" +
      dec(Math.abs(d.pGab - d.rata), 4) + "</b>.</p>" +
      '<p class="note">' + K.md("$\\mathrm{SE}$ gabungan") + " = <b>" + dec(d.se, 4) + "</b> · " +
      K.md("$|\\hat p-p|$") + " = <b>" + dec(gap, 4) + "</b> → " +
      (gap <= 2 * d.se ? "konsisten dengan teori" : "menyimpang, periksa data") + ".</p>" +
      sumber;
  }

  /* perbarui angka tanpa merender ulang (fokus input tidak hilang) */
  function refreshM5() {
    var r = S.rek(state, 5);
    var st = document.getElementById("m5stats");
    var no = document.getElementById("m5notes");
    var tu = document.getElementById("m5tutup");
    var to = document.getElementById("m5toast");
    if (st) { st.innerHTML = m5Stats(r); K.renderMath(st); }
    if (no) { no.innerHTML = m5Notes(r); K.renderMath(no); }
    if (tu) tu.innerHTML = m5Tutup(r);
    if (to) to.hidden = !m5Lengkap(r);
    var ft = document.querySelector("footer.cta");
    if (ft) ft.outerHTML = footerArena(5);   /* tombol bawah ikut berubah tanpa render ulang */
    }

  function footerArena(id) {
    var r = S.rek(state, id);
    var h = S.hitung(r.rolls, r.aturan);
    var selesai = S.status(state, id) === "selesai";
    var b = K.forMisi(id);
    var nextId = id < 5 ? id + 1 : null;
    var utama = "";
    var kedua = "";

    if (selesai && nextId) {
      utama = '<button class="btn btn-primary" data-act="open" data-id="' + nextId + '">Lanjut ke Bagian ' +
        K.forMisi(nextId).kode + " &nbsp;→</button>";
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>' +
              '<button class="mini-btn" data-act="repeat">Ulangi bagian</button>';
    } else if (selesai) {
      utama = '<button class="btn btn-primary" data-act="home">Selesai · ke sampul</button>';
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 1) {
      var s1 = S.sisa(state, 1);
      utama = '<button class="btn btn-primary" data-act="roll1"' + (s1 <= 0 ? " disabled" : "") + ">" +
        (s1 > 0 ? "Lempar dadu · " + h.n + "/5" : "lima lemparan selesai") + "</button>";
      kedua = '<button class="mini-btn" data-act="repeat">Ulangi bagian</button>' +
              '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 2) {
      var s2 = S.sisa(state, 2);
      utama = '<button class="btn btn-primary" data-act="roll1"' + (s2 <= 0 ? " disabled" : "") + ">" +
        (s2 > 0 ? "Lempar dadu · " + h.n + "/10" : "sepuluh lemparan selesai") + "</button>";
      kedua = '<button class="mini-btn" data-act="repeat">Ulangi bagian</button>' +
              '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 3) {
      var siap = r.prediksi !== null && r.prediksi !== undefined;
      utama = siap
        ? '<button class="btn btn-primary" data-act="roll100">Lempar 100×</button>'
        : '<button class="btn btn-primary" disabled>Isi butir prediksi dulu</button>';
      kedua = '<button class="mini-btn" data-act="roll1">Lempar 1×</button>' +
              '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 4) {
      var a4 = ui.rule || 1;
      var s4 = S.sisa(state, 4, a4);
      var n4 = (r.rules[a4] || []).length;
      utama = '<button class="btn btn-primary" data-act="roll60"' + (s4 <= 0 ? " disabled" : "") + ">" +
        (s4 > 0 ? "Lempar 60× · aturan ini (" + n4 + "/60)" : "aturan ini sudah 60/60") + "</button>";
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
    } else {
      /* bagian E: aksi mengisi data simulasi hanya ada satu tempat — tombol di
         dalam panel ("Isi data simulasi" / "Acak ulang data simulasi") */
      if (r.mode === "simulasi" && !m5SimSiap(r)) {
        utama = "";
        kedua = '<button class="mini-btn" data-act="m5mode" data-mode="teman">Data teman</button>' +
                '<button class="mini-btn" data-act="data">Papan data</button>';
      } else if (m5SimSiap(r)) {
        utama = '<button class="btn btn-primary" data-act="data">Buka Papan Data</button>';
        kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
      } else {
        utama = '<button class="btn btn-primary" data-act="m5mode" data-mode="simulasi">Simulasi kelas · tanpa teman</button>';
        kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
      }
    }

    return '<footer class="cta">' + (utama ? '<div class="stack">' + utama + "</div>" : "") +
      (kedua ? '<div class="btn-row">' + kedua + "</div>" : "") +
      '<p class="cta-hint">Bagian ' + b.kode + " · " + (selesai ? "selesai" :
        (S.jumlahJawaban(state, b.kode).terisi + "/" + S.jumlahJawaban(state, b.kode).total + " butir terjawab")) +
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
  function dataUmum(id, m, r) {
    var h = S.hitung(r.rolls, r.aturan);
    var p = S.pAturan(r.aturan);
    /* seluruh lemparan ditampilkan (bukan delapan terakhir): Papan Data adalah
       satu-satunya tempat tabel hasil percobaan */
    var rows = r.rolls.map(function (v, i) {
      var kk = S.hitung(r.rolls.slice(0, i + 1), r.aturan);
      return "<tr><td>" + (i + 1) + "</td><td>" + v + "</td><td class=\"n\">" + (S.sukses(v, r.aturan) ? 1 : 0) +
        "</td><td class=\"n\">" + kk.k + "</td><td class=\"n\">" + dec(kk.phat, 3) + "</td></tr>";
    }).join("");

    return header({ back: true, title: "Papan Data", sub: "Bagian " + K.forMisi(id).kode + " · data percobaan", right: chip("✓ Bagian " + K.forMisi(id).kode) }) +
      '<main class="body wide">' +
      (S.status(state, id) === "selesai" ? selesaiCard(id, r, { papan: true }) : "") +
      '<div class="toast">✓ <div><b>Bagian ' + K.forMisi(id).kode + ":</b> angka di halaman ini boleh langsung kamu pakai untuk mengisi tabel lembar kerja. <b>Kode laporan</b> ada di kotak paling bawah.</div></div>" +
      '<div class="colstack">' +
      statsHTML(h) +
      '<div class="panel"><div class="panel-head"><b>Sebaran teoretis vs empiris</b><span>' + K.md("$|\\hat p-p|$") + " = " +
      (h.n ? dec(Math.abs(h.phat - p), 3) : "—") + "</span></div>" +
      C.pmf(p, h.n ? h.phat : null) + "</div>" +
      "</div>" +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>' + K.md("$\\hat p$ terhadap $n$") + '</b><span>p = ' + dec(p, 3) + "</span></div>" +
      C.konvergensi(r.rolls, r.aturan, p) + "</div>" +
      '<div class="panel"><div class="panel-head"><b>Seluruh lemparan</b><span>' + h.n + " lemparan · urut dari ke-1</span></div>" +
      (rows ? '<div class="tabel-wrap' + (r.rolls.length > 30 ? " tabel-panjang" : "") + '"><table><thead><tr><th>i</th><th>dadu</th><th class="rt">X</th><th class="rt">k</th><th class="rt"><span class="kx" data-tex="\\hat p"></span></th></tr></thead><tbody>' + rows + "</tbody></table></div>"
        : '<p class="note">Belum ada lemparan.</p>') + "</div>" +
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

  /* Misi 4: tiga aturan sekaligus, bukan satu deret lemparan */
  function dataM4(m, r) {
    var baris = [1, 2, 3].map(function (a) {
      var h = S.hitung(r.rules[a] || [], a);
      return "<tr><td>" + (a === 1 ? "6 saja" : a === 2 ? "≥ 5" : "≥ 4") + '</td><td class="n">' + dec(a / 6, 3) +
        '</td><td class="n">' + h.n + '</td><td class="n">' + h.k +
        '</td><td class="n">' + (h.n ? dec(h.phat, 3) : "—") + "</td></tr>";
    }).join("");
    var bars = [1, 2, 3].map(function (a) {
      return { label: a === 1 ? "6" : a === 2 ? "5–6" : "4–6", p: a / 6 };
    });
    return header({ back: true, title: "Papan Data", sub: "Bagian D · data percobaan", right: chip("✓ Bagian D") }) +
      '<main class="body wide">' +
      (S.status(state, 4) === "selesai" ? selesaiCard(4, r, { papan: true }) : "") +
      '<div class="toast">✓ <div><b>Bagian D:</b> tiga aturan dengan 60 lemparan masing-masing. Isi tabel p dan E[X] di lembar kerja, lalu bandingkan dengan kode laporan di bawah.</div></div>' +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>Tiga aturan sukses</b><span>60 lemparan per aturan</span></div>' +
      '<table><thead><tr><th>aturan</th><th class="rt">p = E[X]</th><th class="rt">n</th><th class="rt">k</th><th class="rt"><span class="kx" data-tex="\\hat p"></span></th></tr></thead><tbody>' +
      baris + "</tbody></table></div>" +
      '<div class="panel"><div class="panel-head"><b>Peluang tiap aturan</b><span>p = |A|/6</span></div>' +
      C.aturanBars(bars) + "</div>" +
      "</div>" +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>Ragam teoretis</b><span>Var(X) = p(1 − p)</span></div>' +
      '<table><thead><tr><th>aturan</th><th class="rt">p(1−p)</th></tr></thead><tbody>' +
      [1, 2, 3].map(function (a) {
        var p = a / 6;
        return "<tr><td>" + (a === 1 ? "6 saja" : a === 2 ? "≥ 5" : "≥ 4") + '</td><td class="n">' + dec(p * (1 - p), 3) + "</td></tr>";
      }).join("") + "</tbody></table>" +
      '<p class="note">Ragam terbesar ada pada p = 0,5 (aturan ≥ 4), karena hasil paling tidak pasti.</p></div>' +
      "</div>" +
      "</main>" +
      '<footer class="cta">' +
      '<div class="code-card"><div><div class="lab">Kode laporan (aturan 6 saja)</div><div class="code" id="kodeTeks">' + kodeUntuk(4) + "</div></div>" +
      '<button class="copy" data-act="copy">Salin</button></div>' +
      (S.status(state, 4) === "selesai"
        ? '<button class="btn btn-primary" data-act="open" data-id="5" style="margin-top:9px">Lanjut ke Bagian E &nbsp;→</button>' +
          '<div class="btn-row"><button class="mini-btn" data-act="back">Kembali ke lembar kerja</button></div>'
        : '<button class="btn btn-primary" data-act="back" style="margin-top:9px">Kembali ke lembar kerja</button>') +
      "</footer>" +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  /* Misi 5: bukan percobaan baru, jadi yang ditampilkan data gabungan */
  function dataM5(m, r) {
    var d = m5Data(r);
    var sim = m5Simulasi(r);
    var baris = m5Baris(r).map(function (t, i) {
      var n = Number(t.n), k = Number(t.k);
      var nama = sim ? '<span class="simp">simulasi</span>' : esc(t.nama || "—");
      return "<tr><td>" + (i + 1) + "</td><td>" + nama + '</td><td class="n">' + (t.n || "—") +
        '</td><td class="n">' + (t.k || "—") + '</td><td class="n">' + (n > 0 ? dec(k / n, 3) : "—") + "</td></tr>";
    }).join("");
    return header({ back: true, title: "Papan Data", sub: "Bagian E · data gabungan", right: chip("✓ Bagian E") }) +
      '<main class="body wide">' +
      (S.status(state, 5) === "selesai" ? selesaiCard(5, r, { papan: true }) : "") +
      '<div class="toast">✓ <div><b>Bagian E:</b> data yang digabungkan adalah data Bagian C milikmu ditambah tiga baris lain. Kode laporan di bawah merangkum data Bagian C.</div></div>' +
      '<div class="colstack">' +
      '<div class="stats">' + m5Stats(r) + "</div>" +
      '<div class="panel" id="m5notes">' + m5Notes(r) + "</div>" +
      "</div>" +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>Data yang digabungkan</b><span>' +
      (sim ? "Misi 3 kamu + tiga baris simulasi" : "Misi 3 kamu + tiga teman") + "</span></div>" +
      '<table><thead><tr><th>#</th><th>' + (sim ? "sumber" : "nama") + '</th><th class="rt">n</th><th class="rt">k</th><th class="rt"><span class="kx" data-tex="\\hat p"></span></th></tr></thead><tbody>' +
      '<tr><td>—</td><td>kamu (Misi 3)</td><td class="n">' + d.mineN + '</td><td class="n">' + d.mineK +
      '</td><td class="n">' + (d.mineN ? dec(d.mineK / d.mineN, 3) : "—") + "</td></tr>" +
      baris + "</tbody></table></div>" +
      "</div>" +
      "</main>" +
      '<footer class="cta">' +
      '<button class="btn btn-primary" data-act="' + (S.status(state, 5) === "selesai" ? "home" : "back") + '">' +
      (S.status(state, 5) === "selesai" ? "Selesai · ke sampul" : "Kembali ke lembar kerja") + "</button>" +
      '<div class="btn-row"><button class="mini-btn" data-act="back">Kembali ke lembar kerja</button></div>' +
      "</footer>" +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  function renderData(id) {
    var m = S.def(id);
    var r = S.rek(state, id);
    if (id === 5) return dataM5(m, r);
    if (id === 4) return dataM4(m, r);
    return dataUmum(id, m, r);
  }

  /* ---------------- render ---------------- */
  function render() {
    var r = route();
    /* butir bertipe tabeldata (Bagian A) mengikuti data lemparan; selaraskan
       dulu supaya status butir dan status misi memakai nilai terbaru */
    if (K && K.selaraskan) K.selaraskan(state);
    S.sinkron(state);
    if (r.view === "home") $app.innerHTML = renderHome();
    else if (r.view === "arena") $app.innerHTML = renderArena(r.id);
    else $app.innerHTML = renderData(r.id);
    K.renderMath($app);
    ui.pesan = null;
    var b = document.querySelector(".body");
    if (b) b.scrollTop = 0;
  }
  function force() { render(); }

  /* ---------------- aksi ---------------- */
  function simpanNama(i, field, val) {
    var r = S.rek(state, 5);
    if (!r.teman[i]) r.teman[i] = { nama: "", n: "", k: "" };
    r.teman[i][field] = val;
    S.sinkron(state);
    S.simpan(state);
  }

  /* dipanggil sesudah satu butir LKM berubah */
  function setelahJawab(bt) {
    if (bt && bt.gerbang === "prediksi") {
      var v = S.jawabNilai(state, bt.id);
      var num = parseFloat(String(v === null || v === undefined ? "" : v).replace(",", "."));
      var r3 = S.rek(state, 3);
      r3.prediksi = isNaN(num) ? null : Math.max(0, Math.min(100, Math.round(num)));
    }
    S.sinkron(state);
    S.simpan(state);

    if (bt && SN) SN.tandai(bt.id);
    var rt = route();
    var b = K.forMisi(rt.id);
    if (b) K.refresh(b.kode, state);
    if (rt.view === "arena" && rt.id === 5) refreshM5();

    if (rt.view === "arena" && rt.id === 3) {
      var pc = document.querySelector(".predict");
      var rp = S.rek(state, 3);
      if (pc && rp.prediksi !== null && rp.prediksi !== undefined) {
        pc.outerHTML = '<div class="predict done"><div class="q">Tebakanmu: <b>' + rp.prediksi +
          " kali</b>" + (rp.rolls.length >= 100 ? " · hasil: <b>" + S.hitung(rp.rolls, rp.aturan).k +
          " kali</b>" : " · belum dijalankan") + "</div></div>";
      }
    }
    refreshFooter();
  }

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
      case "data": go("#/misi/" + id + "/data"); break;
      case "roll1": {
        S.lempar(state, id, 1);
        var d = document.querySelector(".die");
        if (d) d.classList.add("rolling");
        setTimeout(force, 260);
        break;
      }
      case "roll100": {
        S.lempar(state, 3, 100);
        force();
        break;
      }
      case "roll60": {
        S.lempar(state, 4, 60, ui.rule || 1);
        force();
        break;
      }
      case "pred": {
        var d2 = parseInt(el.getAttribute("data-d"), 10);
        ui.predTmp = Math.max(0, Math.min(100, (ui.predTmp === undefined ? 17 : ui.predTmp) + d2));
        var v = document.getElementById("predVal");
        if (v) v.textContent = ui.predTmp;
        break;
      }
      case "pred-simpan": {
        var r3 = S.rek(state, 3);
        if (r3.prediksi === null) r3.prediksi = ui.predTmp === undefined ? 17 : ui.predTmp;
        S.simpan(state);
        force();
        break;
      }
      case "rule":
        ui.rule = parseInt(el.getAttribute("data-a"), 10);
        force();
        break;
      case "rule-reset": {
        var r4 = S.rek(state, 4);
        r4.rules[ui.rule || 1] = [];
        S.simpan(state);
        force();
        break;
      }
      case "m5mode": {
        var mode5 = el.getAttribute("data-mode") === "simulasi" ? "simulasi" : "teman";
        var r5 = S.rek(state, 5);
        r5.mode = mode5;
        /* mode diganti ≠ data dibuat: biarkan tabel kosong supaya siswa
           sempat membaca penjelasan dan menekan "Isi data simulasi" */
        S.sinkron(state);
        S.simpan(state);
        var sc5 = (document.querySelector(".body") || {}).scrollTop || 0;
        force();
        var b5 = document.querySelector(".body");
        if (b5) b5.scrollTop = sc5;
        break;
      }
      case "m5isi": {
        var ri = S.rek(state, 5);
        ri.mode = "simulasi";
        ri.sim = buatSimulasi();
        S.sinkron(state);
        S.simpan(state);
        var sc6 = (document.querySelector(".body") || {}).scrollTop || 0;
        force();
        var b6 = document.querySelector(".body");
        if (b6) b6.scrollTop = sc6;
        break;
      }
      case "m5acak": {
        var ra = S.rek(state, 5);
        ra.sim = buatSimulasi();
        S.simpan(state);
        force();
        break;
      }
      case "repeat": {
        S.ulangi(state, id);
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
      case "reset-confirm": state = S.resetProgres(); ui.sheet = null; ui.pesan = "Progres dihapus. Mulai lagi dari Misi 1."; go("#/"); break;
      case "reset-all": state = S.resetSemua(); ui.sheet = null; ui.pesan = "Semua data dihapus dari perangkat ini."; go("#/"); break;
      case "sheet-close": ui.sheet = null; force(); break;
      case "sheet-stop": break;
    }
  });

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
    if (t.dataset && t.dataset.m5) {
      simpanNama(parseInt(t.dataset.i, 10), t.dataset.m5, t.value);
      refreshM5();
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

  /* keyboard: spasi = lempar 1 (kalau bukan di input) */
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      var r = route();
      if (r.view === "arena" && r.id !== 3 && r.id !== 5) {
        e.preventDefault();
        S.lempar(state, r.id, 1, ui.rule || 1);
        force();
      }
    }
  });

  /* hapus data: server dulu, lalu perangkat */
  function hapusDataSaya() {
    var lanjutHapus = function (hasil) {
      state = S.resetSemua();
      ui.sheet = null;
      ui.hapusLangkah = 0;
      ui.pesan = "Data dihapus." + (hasil && hasil.deleted ? " Server melaporkan " +
        ((hasil.jumlah && (hasil.jumlah.jawaban + hasil.jumlah.lemparan + hasil.jumlah.peserta)) || 0) +
        " baris terhapus." : "");
      go("#/");
      if (A && A.aktif()) { A.keluar(); }
    };
    if (!(A && A.aktif())) { lanjutHapus(null); return; }
    A.api("/api/peserta", { method: "DELETE" }).then(function (r) {
      lanjutHapus(r.ok && r.data ? r.data : null);
    }).catch(function () { lanjutHapus(null); });
  }

  /* jawaban server digabung kalau perangkat ini belum punya (ganti perangkat) */
  function gabungJawabanServer(sesi) {
    var srv = (sesi && sesi.jawabanServer) || {};
    var ubah = false;
    Object.keys(srv).forEach(function (id) {
      var lokal = state.jawaban[id];
      var jauh = srv[id];
      if (!jauh) return;
      if (!lokal || String(jauh.ts || "") > String(lokal.ts || "")) {
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

  A.mulai(function (sesi) {
    if (sesi && sesi.mode === "server") gabungJawabanServer(sesi);
    S.sinkron(state);
    if (!location.hash) location.replace("#/");
    render();
    if (SN) SN.mulai();
  });
})();
