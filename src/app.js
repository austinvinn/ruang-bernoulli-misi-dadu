/* =========================================================
   app.js — router, layar, dan interaksi Misi Dadu
   Semua state disimpan lewat Store; render ulang setelah aksi.
   ========================================================= */
(function () {
  "use strict";

  var S = window.Store;
  var C = window.Charts;
  var L = window.Laporan;

  var state = S.baca();
  var ui = { sheet: null, pesan: null, salah: null, m5nama: "" };

  var $app = document.getElementById("app");

  /* ---------------- util ---------------- */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dec(x, d) { return Number(x).toFixed(d === undefined ? 3 : d); }
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
  function statsHTML(h, label) {
    return '<div class="stats">' +
      '<div class="stat"><span>n</span><b>' + h.n + "</b></div>" +
      '<div class="stat"><span>k</span><b>' + h.k + "</b></div>" +
      '<div class="stat accent"><span>' + (label || "p̂") + '</span><b>' + dec(h.phat, 3) + "</b></div>" +
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
      '<button class="whoami" data-act="tentang" aria-label="Kredit tim pengembang">Tim Pengembang</button>' +
      "</div></div>" +
      "</div>" +
      (opts.right || "") +
      "</header>";
  }

  /* ---------------- HOME ---------------- */
  function renderHome() {
    var mulai = S.sudahMulai(state);
    var aktif = S.aktif(state);
    var selesai = S.jumlahSelesai(state);
    var semuaSelesai = selesai === 5;
    var st = S.status(state, aktif);
    var judul = semuaSelesai
      ? "<h2 class=\"title\">Semua misi<br>selesai.</h2>"
      : (mulai
        ? "<h2 class=\"title\">Lanjutkan dari<br>Misi " + aktif + "</h2>"
        : "<h2 class=\"title\">Berapa kali angka 6<br>muncul dari 100 lemparan?</h2>");
    var sub = semuaSelesai
      ? '<p class="sub">Kamu bisa mengulang misi mana pun, atau mengunduh progres untuk arsip.</p>'
      : (mulai
        ? '<p class="sub">' + selesai + " dari 5 misi selesai. Sisa " + (5 - selesai) + " misi, sekitar 15 menit.</p>"
        : '<p class="sub">Tebak dulu, lempar, lalu buktikan. Hasilnya kamu tulis di LKPD.</p>');

    var list = "";
    S.MISI.forEach(function (m) {
      var s = S.status(state, m.id);
      var cls = s === "selesai" ? "done" : (m.id === aktif ? "active" : "locked");
      var num = s === "selesai" ? "✓" : m.id;
      var note = s === "selesai" ? m.sub + " · selesai" : (m.id === aktif ? m.sub + " · " + (st === "berjalan" ? "sedang berjalan" : "belum dimulai") : m.sub);
      list += '<button class="mission ' + cls + '" data-act="open" data-id="' + m.id + '">' +
        '<span class="m-num">' + num + "</span>" +
        '<span class="m-txt"><span class="m-title">' + esc(m.judul) + '</span><span class="m-note">' + note + "</span></span>" +
        (s === "selesai" ? "" : '<span class="m-go">›</span>') +
        "</button>";
    });

    var target = '<div class="target"><div class="eyebrow">Target misi ini</div>' +
      "<div>LKPD " + esc(S.def(aktif).lkpd) + " — " + esc(S.def(aktif).sub) +
      ". Tulis hasilnya di kertas, lalu kembali ke sini.</div></div>";

    var ident = '<div class="panel" id="identCard"><div class="panel-head"><b>Identitas laporan</b><span>opsional</span></div>' +
      '<div class="idrow">' +
      '<input class="inp" data-ident="nama" value="' + esc(state.peserta.nama) + '" placeholder="Nama" aria-label="Nama untuk laporan">' +
      '<input class="inp" type="email" data-ident="email" value="' + esc(state.peserta.email) + '" placeholder="Email" aria-label="Email untuk laporan">' +
      "</div>" +
      '<p class="note">Hanya jadi label di laporan dan kode. Tidak dikirim ke server mana pun.</p></div>';

    return header({
      title: "Ruang Bernoulli",
      right: chip(selesai + " / 5 selesai")
    }) +
      '<main class="body">' +
      '<div class="hero"><div class="eyebrow">Distribusi Bernoulli</div>' + judul + sub + "</div>" +
      segbar() +
      ident +
      target +
      '<div class="mlist">' + list + "</div>" +
      (ui.pesan ? '<div class="toast">✓ <div>' + ui.pesan + "</div></div>" : "") +
      "</main>" +
      '<footer class="cta">' +
      '<button class="btn btn-primary" data-act="open" data-id="' + aktif + '">' +
      (semuaSelesai ? "Buka Misi " + aktif : (mulai ? "Lanjutkan Misi " + aktif : "Mulai Misi 1")) + " &nbsp;→</button>" +
      '<div class="linkrow">' +
      (mulai ? '<button class="link warn" data-act="reset-open">↻ Mulai ulang</button>' : "") +
      '<button class="link" data-act="import">⇩ Pulihkan</button>' +
      (mulai ? '<button class="link" data-act="export">⇧ Unduh progres</button>' : "") +
      "</div>" +
      '<div class="devicenote"><i class="dot-ok"></i> Progres tersimpan di perangkat ini</div>' +
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
      '<p>Media pembelajaran interaktif Distribusi Bernoulli untuk mahasiswa statistika matematika. ' +
      "Satu percobaan (dadu), lima misi, lima bagian LKPD. Berjalan tanpa server dan tanpa akun.</p>" +
      '<div class="divider"></div>' +
      '<div class="eyebrow">Tim pengembang · Kelompok 9</div>' +
      '<ol class="tim">' + tim + "</ol>" +
      '<div class="inst">' +
      "PROGRAM STUDI PENDIDIKAN MATEMATIKA<br>" +
      "FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN<br>" +
      "UNIVERSITAS SRIWIJAYA<br>" +
      '<span class="tahun">2026</span>' +
      "</div>" +
      '<button class="b2" data-act="sheet-close" style="margin-top:12px;width:100%">Tutup</button>' +
      "</div></div>";
  }

  function sheetHTML() {
    if (ui.sheet === "reset") return sheetReset();
    if (ui.sheet === "tentang") return sheetTentang();
    return "";
  }

  function sheetReset() {
    return '<div class="overlay" data-act="sheet-close">' +
      '<div class="sheet" data-stop="1">' +
      "<h4>Mulai ulang dari awal?</h4>" +
      "<p>Semua lemparan dan progres 5 misi di perangkat ini akan dihapus. Kode laporan yang sudah kamu tulis di LKPD tidak terpengaruh.</p>" +
      '<div class="acts">' +
      '<button class="b1" data-act="reset-confirm">Ya, hapus progres</button>' +
      '<button class="b2" data-act="sheet-close">Batal</button>' +
      "</div>" +
      '<button class="link warn tiny" data-act="reset-all">Hapus semua termasuk nama &amp; email</button>' +
      "</div></div>";
  }

  /* ---------------- ARENA ---------------- */
  function renderArena(id) {
    var m = S.def(id);
    var r = S.rek(state, id);
    var st = S.status(state, id);
    var isi = "";

    if (st === "terkunci") {
      isi = '<div class="locked-note">Misi ini terbuka setelah Misi ' + (id - 1) +
        " selesai. <br><button class=\"link\" data-act=\"home\">Kembali ke Beranda</button></div>";
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

    return header({
      back: true,
      title: m.judul,
      sub: "Misi " + id + " · " + m.lkpd,
      right: chip("n = " + (id === 4 ? "60/aturan" : id === 5 ? "3 teman" : (r.rolls.length || 0)))
    }) +
      '<main class="body ' + (id === 3 ? "wide" : "") + '">' + isi + "</main>" +
      footerArena(id) +
      sheetHTML() +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  function arenaM1(r) {
    var h = S.hitung(r.rolls, r.aturan);
    var last = r.rolls.length ? r.rolls[r.rolls.length - 1] : 6;
    var sisa = Math.max(0, 5 - h.n);
    return '<div class="die-stage">' + dieHTML(last) + "</div>" +
      '<div class="center small muted">' + (sisa ? "Sisa " + sisa + " lemparan" : "5 lemparan selesai") + "</div>" +
      statsHTML(h) +
      '<div class="panel"><div class="panel-head"><b>Aturan pencatatan</b><span>aturan sukses</span></div>' +
      '<p class="note">Muncul <b>6</b> → sukses, ditulis <b>X = 1</b>. Selain 6 → gagal, ditulis <b>X = 0</b>.</p>' +
      '<div class="chips">' +
      '<span class="tag">' + (h.k) + " sukses</span>" +
      '<span class="tag">' + (h.n - h.k) + " gagal</span>" +
      '<span class="tag">p = 1/6 ≈ 0,167</span></div></div>' +
      (h.n >= 5 ? '<div class="toast">✓ <div><b>Misi 1 selesai.</b> Tulis X untuk 5 lemparan di LKPD bagian A, lalu lanjut.</div></div>' : "");
  }

  function arenaM2(r) {
    var h = S.hitung(r.rolls, r.aturan);
    var last = r.rolls.length ? r.rolls[r.rolls.length - 1] : 6;
    var rows = r.rolls.slice(-5).reverse().map(function (v, i) {
      var idx = r.rolls.length - i;
      var kk = S.hitung(r.rolls.slice(0, idx), r.aturan);
      return "<tr><td>" + idx + "</td><td>" + v + "</td><td class=\"n\">" + (S.sukses(v, r.aturan) ? 1 : 0) +
        "</td><td class=\"n\">" + kk.k + "</td><td class=\"n\">" + dec(kk.phat, 3) + "</td></tr>";
    }).join("");
    return '<div class="die-stage">' + dieHTML(last) + "</div>" +
      statsHTML(h) +
      '<div class="panel"><div class="panel-head"><b>Catatan terakhir</b><span>dari ' + h.n + " lemparan</span></div>" +
      (rows ? '<table><thead><tr><th>i</th><th>dadu</th><th class="rt">X</th><th class="rt">k</th><th class="rt">p̂</th></tr></thead><tbody>' + rows + "</tbody></table>"
        : '<p class="note">Belum ada lemparan.</p>') +
      "</div>" +
      '<p class="note center">Bandingkan p̂ dengan p = 0,167. Selisih sekarang: <b>' +
      (h.n ? (h.phat - 1 / 6 >= 0 ? "+" : "") + dec(h.phat - 1 / 6, 3) : "—") + "</b></p>" +
      (h.n >= 10 ? '<div class="toast">✓ <div><b>Misi 2 selesai.</b> Isi tabel 10 lemparan di LKPD bagian B.</div></div>' : "");
  }

  function arenaM3(r) {
    var h = S.hitung(r.rolls, r.aturan);
    var last = r.rolls.length ? r.rolls[r.rolls.length - 1] : 6;
    var pred = r.prediksi;
    var predCard = pred === null
      ? '<div class="predict"><div class="q">Tebak dulu: berapa kali angka 6 muncul dari 100 lemparan?</div>' +
        '<div class="stepper"><button data-act="pred" data-d="-1" aria-label="kurangi">−</button>' +
        '<div class="val" id="predVal">' + (ui.predTmp === undefined ? 17 : ui.predTmp) + "</div>" +
        '<button data-act="pred" data-d="1" aria-label="tambah">+</button></div>' +
        '<button class="btn btn-primary sm" data-act="pred-simpan">Kunci tebakan</button></div>'
      : '<div class="predict done"><div class="q">Tebakanmu: <b>' + pred + " kali</b>" +
        (h.n >= 100 ? " · hasil: <b>" + h.k + " kali</b>" : " · belum dijalankan") + "</div></div>";
    return '<div class="colstack">' +
      '<div class="die-stage">' + dieHTML(last) + "</div>" + predCard +
      '<div class="panel"><div class="panel-head"><b>Alur misi</b><span>4 langkah</span></div>' +
      '<ol class="small" style="margin:0;padding-left:18px;color:var(--ink-2);line-height:1.7">' +
      "<li>Tebak kira-kira berapa kali angka 6 muncul.</li>" +
      "<li>Kunci tebakan (tombol kuning).</li>" +
      "<li>Jalankan 100 lemparan sekaligus.</li>" +
      "<li>Bandingkan p̂ dengan p = 0,167, lalu tulis di LKPD.</li></ol></div>" +
      "</div>" +
      '<div class="colstack">' +
      statsHTML(h) +
      '<div class="panel"><div class="panel-head"><b>p̂ terhadap n</b><span>p = 0,167</span></div>' +
      C.konvergensi(r.rolls, r.aturan, 1 / 6) + "</div>" +
      "</div>" +
      (h.n >= 100 ? '<div class="toast">✓ <div><b>Misi 3 selesai.</b> |p̂ − p| = ' + dec(Math.abs(h.phat - 1 / 6), 3) +
        " · tulis grafik &amp; kesimpulan di LKPD bagian C.</div></div>" : "");
  }

  function arenaM4(r) {
    var aturanAktif = ui.rule || 1;
    var baris = [1, 2, 3].map(function (a) {
      var arr = r.rules[a] || [];
      var h = S.hitung(arr, a);
      return { a: a, label: a === 1 ? "6" : (a === 2 ? "5–6" : "4–6"), p: a / 6, n: h.n, k: h.k, phat: h.phat };
    });
    var tabel = baris.map(function (b) {
      return "<tr><td>" + b.label + "</td><td class=\"n\">" + dec(b.p, 3) + "</td><td class=\"n\">" + b.n +
        "</td><td class=\"n\">" + b.k + "</td><td class=\"n\">" + (b.n ? dec(b.phat, 3) : "—") + "</td></tr>";
    }).join("");
    var tabs = [1, 2, 3].map(function (a) {
      return '<button class="tab ' + (a === aturanAktif ? "on" : "") + '" data-act="rule" data-a="' + a + '">' +
        (a === 1 ? "6 saja" : a === 2 ? "≥ 5" : "≥ 4") + "</button>";
    }).join("");
    var aktifBaris = baris.filter(function (b) { return b.a === aturanAktif; })[0];
    return '<div class="tabs">' + tabs + "</div>" +
      '<div class="panel"><div class="panel-head"><b>Aturan aktif</b><span>p = ' + dec(aktifBaris.p, 3) + "</span></div>" +
      '<p class="note">Sukses jika dadu menunjukkan ' + (aturanAktif === 1 ? "6" : aturanAktif === 2 ? "5 atau 6" : "4, 5, atau 6") +
      ". Lempar 60× untuk aturan ini (" + aktifBaris.n + "/60).</p>" +
      '<div class="btn-row"><button class="btn btn-primary sm" data-act="roll60">Lempar 60× aturan ini</button>' +
      '<button class="btn btn-ghost sm" data-act="rule-reset">Ulangi aturan ini</button></div></div>' +
      '<div class="panel"><div class="panel-head"><b>Ringkasan tiga aturan</b><span>n = 60 per aturan</span></div>' +
      '<table><thead><tr><th>sukses</th><th class="rt">p</th><th class="rt">n</th><th class="rt">k</th><th class="rt">p̂</th></tr></thead><tbody>' +
      tabel + "</tbody></table>" +
      '<div style="margin-top:10px">' + C.aturanBars(baris.map(function (b) { return { label: b.label, p: b.p }; })) + "</div></div>" +
      (r.rules[1] && r.rules[1].length >= 60 && r.rules[2] && r.rules[2].length >= 60 && r.rules[3] && r.rules[3].length >= 60
        ? '<div class="toast">✓ <div><b>Misi 4 selesai.</b> Isi tabel p, E[X], Var(X) di LKPD bagian D.</div></div>' : "");
  }

  function arenaM5(r) {
    var teman = r.teman || [];
    var baris = "";
    for (var i = 0; i < 3; i++) {
      var t = teman[i] || { nama: "", n: "", k: "" };
      baris += '<tr><td>' + (i + 1) + "</td>" +
        '<td><input class="inp" data-m5="nama" data-i="' + i + '" value="' + esc(t.nama) + '" placeholder="nama" aria-label="Nama teman ' + (i + 1) + '"></td>' +
        '<td><input class="inp num" data-m5="n" data-i="' + i + '" inputmode="numeric" value="' + esc(t.n) + '" placeholder="n" aria-label="n teman ' + (i + 1) + '"></td>' +
        '<td><input class="inp num" data-m5="k" data-i="' + i + '" inputmode="numeric" value="' + esc(t.k) + '" placeholder="k" aria-label="k teman ' + (i + 1) + '"></td></tr>';
    }
    return '<div class="panel"><div class="panel-head"><b>Data teman</b><span>isi n dan k dari kode laporan mereka</span></div>' +
      '<table><thead><tr><th>#</th><th>nama</th><th class="rt">n</th><th class="rt">k</th></tr></thead><tbody>' + baris + "</tbody></table>" +
      '<p class="note">Data kamu sendiri: n = ' + m5Data(r).mineN + ", k = " + m5Data(r).mineK + " — ikut dihitung pada gabungan.</p></div>" +
      '<div class="stats" id="m5stats">' + m5Stats(r) + "</div>" +
      '<div class="panel" id="m5notes">' + m5Notes(r) + "</div>" +
      '<div class="toast" id="m5toast"' + (m5Lengkap(r) ? "" : ' hidden') + '>✓ <div><b>Misi 5 selesai.</b> Simpulkan peran n di LKPD bagian E.</div></div>';
  }

  function m5Data(r) {
    var teman = r.teman || [];
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
      nTeman: valid.length
    };
  }
  function m5Lengkap(r) { return m5Data(r).valid.length >= 3; }

  function m5Stats(r) {
    var d = m5Data(r);
    return '<div class="stat"><span>Σn</span><b>' + d.totalN + "</b></div>" +
      '<div class="stat"><span>Σk</span><b>' + d.totalK + "</b></div>" +
      '<div class="stat accent"><span>p̂ gabungan</span><b>' + dec(d.pGab, 4) + "</b></div>";
  }

  function m5Notes(r) {
    var d = m5Data(r);
    var gap = Math.abs(d.pGab - 1 / 6);
    return '<div class="panel-head"><b>Dua cara menggabungkan</b><span>p = 0,1667</span></div>' +
      '<p class="note">Σk/Σn = <b>' + dec(d.pGab, 4) + "</b> (tertimbang ukuran sampel) · rata-rata p̂ = <b>" + dec(d.rata, 4) +
      "</b> (tidak tertimbang). Selisih: <b>" + dec(Math.abs(d.pGab - d.rata), 4) + "</b>.</p>" +
      '<p class="note">SE gabungan = √(p(1−p)/Σn) = <b>' + dec(d.se, 4) + "</b> · |p̂ − p| = <b>" + dec(gap, 4) +
      "</b> → " + (gap <= 2 * d.se ? "konsisten dengan teori" : "menyimpang, periksa data") + ".</p>" +
      '<p class="note">' + d.valid.length + " dari 3 data teman terisi.</p>";
  }

  /* perbarui angka tanpa merender ulang (fokus input tidak hilang) */
  function refreshM5() {
    var r = S.rek(state, 5);
    var st = document.getElementById("m5stats");
    var no = document.getElementById("m5notes");
    var to = document.getElementById("m5toast");
    if (st) st.innerHTML = m5Stats(r);
    if (no) no.innerHTML = m5Notes(r);
    if (to) to.hidden = !m5Lengkap(r);
    }

  function footerArena(id) {
    var r = S.rek(state, id);
    var h = S.hitung(r.rolls, r.aturan);
    var selesai = S.status(state, id) === "selesai";
    var nextId = id < 5 ? id + 1 : null;
    var utama = "";
    var kedua = "";

    if (selesai && nextId) {
      utama = '<button class="btn btn-primary" data-act="open" data-id="' + nextId + '">Lanjut ke Misi ' + nextId + " &nbsp;→</button>";
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>' +
              '<button class="mini-btn" data-act="repeat">Ulangi misi</button>';
    } else if (selesai) {
      utama = '<button class="btn btn-primary" data-act="home">Selesai · ke Beranda</button>';
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 1) {
      utama = '<button class="btn btn-primary" data-act="roll1">Lempar dadu</button>';
      kedua = '<button class="mini-btn" data-act="repeat">Ulangi misi</button>' +
              '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 2) {
      utama = '<button class="btn btn-primary" data-act="roll1">Lempar dadu (' + h.n + "/10)</button>";
      kedua = '<button class="mini-btn" data-act="repeat">Ulangi misi</button>' +
              '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 3) {
      var siap = r.prediksi !== null;
      utama = siap
        ? '<button class="btn btn-primary" data-act="roll100">Lempar 100×</button>'
        : '<button class="btn btn-primary" data-act="pred-simpan">Kunci tebakan dulu</button>';
      kedua = '<button class="mini-btn" data-act="roll1">Lempar 1×</button>' +
              '<button class="mini-btn" data-act="data">Papan data</button>';
    } else if (id === 4) {
      utama = '<button class="btn btn-primary" data-act="roll60">Lempar 60×</button>';
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
    } else {
      utama = '<button class="btn btn-primary" data-act="home">Selesai · ke Beranda</button>';
      kedua = '<button class="mini-btn" data-act="data">Papan data</button>';
    }

    return '<footer class="cta"><div class="stack">' + utama + "</div>" +
      (kedua ? '<div class="btn-row">' + kedua + "</div>" : "") + "</footer>";
  }

  /* ---------------- PAPAN DATA ---------------- */
  function renderData(id) {
    var m = S.def(id);
    var r = S.rek(state, id);
    var h = id === 4 ? S.hitung(r.rules[1] || [], 1) : S.hitung(r.rolls, r.aturan);
    var p = id === 4 ? 1 / 6 : S.pAturan(r.aturan);
    var rows = r.rolls.slice(-8).reverse().map(function (v, i) {
      var idx = r.rolls.length - i;
      var kk = S.hitung(r.rolls.slice(0, idx), r.aturan);
      return "<tr><td>" + idx + "</td><td>" + v + "</td><td class=\"n\">" + (S.sukses(v, r.aturan) ? 1 : 0) +
        "</td><td class=\"n\">" + kk.k + "</td><td class=\"n\">" + dec(kk.phat, 3) + "</td></tr>";
    }).join("");
    var kode = kodeUntuk(id);

    return header({ back: true, title: "Papan Data", sub: "Misi " + id + " · " + m.lkpd, right: chip("✓ " + m.lkpd) }) +
      '<main class="body wide">' +
      '<div class="colstack">' +
      statsHTML(h) +
      '<div class="panel"><div class="panel-head"><b>PMF: teoretis vs empiris</b><span>|p̂ − p| = ' +
      (h.n ? dec(Math.abs(h.phat - p), 3) : "—") + "</span></div>" +
      C.pmf(p, h.n ? h.phat : null) + "</div>" +
      "</div>" +
      '<div class="colstack">' +
      '<div class="panel"><div class="panel-head"><b>p̂ terhadap n</b><span>p = ' + dec(p, 3) + "</span></div>" +
      C.konvergensi(r.rolls, r.aturan, p) + "</div>" +
      '<div class="panel"><div class="panel-head"><b>Lemparan terakhir</b><span>dari ' + h.n + "</span></div>" +
      (rows ? '<table><thead><tr><th>i</th><th>dadu</th><th class="rt">X</th><th class="rt">k</th><th class="rt">p̂</th></tr></thead><tbody>' + rows + "</tbody></table>"
        : '<p class="note">Belum ada lemparan.</p>') + "</div>" +
      "</div>" +
      '<div class="toast">✓ <div><b>LKPD ' + m.lkpd + ":</b> salin angka di atas, lalu tulis kode laporan di kotak yang tersedia.</div></div>" +
      "</main>" +
      '<footer class="cta">' +
      '<div class="code-card"><div><div class="lab">Kode laporan</div><div class="code" id="kodeTeks">' + kode + '</div></div>' +
      '<button class="copy" data-act="copy">Salin</button></div>' +
      (S.status(state, id) === "selesai" && id < 5
        ? '<button class="btn btn-primary" data-act="open" data-id="' + (id + 1) + '" style="margin-top:9px">Lanjut ke Misi ' + (id + 1) + " &nbsp;→</button>" +
          '<div class="btn-row"><button class="mini-btn" data-act="back">Kembali ke Arena</button></div>'
        : '<button class="btn btn-primary" data-act="back" style="margin-top:9px">Kembali ke Arena</button>') +
      "</footer>" +
      '<input type="file" id="fileImpor" accept="application/json" hidden>';
  }

  /* ---------------- render ---------------- */
  function render() {
    var r = route();
    if (r.view === "home") $app.innerHTML = renderHome();
    else if (r.view === "arena") $app.innerHTML = renderArena(r.id);
    else $app.innerHTML = renderData(r.id);
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

  document.addEventListener("click", function (e) {
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
      case "roll100": S.lempar(state, id, 100); force(); break;
      case "roll60": S.lempar(state, 4, 60, ui.rule || 1); force(); break;
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
      case "reset-open": ui.sheet = "reset"; force(); break;
      case "tentang": ui.sheet = "tentang"; force(); break;
      case "reset-confirm": state = S.resetProgres(); ui.sheet = null; ui.pesan = "Progres dihapus. Mulai lagi dari Misi 1."; go("#/"); break;
      case "reset-all": state = S.resetSemua(); ui.sheet = null; ui.pesan = "Semua data dihapus dari perangkat ini."; go("#/"); break;
      case "sheet-close": ui.sheet = null; force(); break;
      case "sheet-stop": break;
    }
  });

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.ident) {
      state.peserta[t.dataset.ident] = t.value;
      S.simpan(state);
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

  S.sinkron(state);
  if (!location.hash) location.replace("#/");
  render();
})();
