/* =========================================================
   store.js — progres belajar "Ruang Bernoulli: Misi Dadu"
   Tanpa backend. Sumber kebenaran = localStorage.
   Data mentah (nilai dadu tiap lemparan) disimpan, bukan agregat.
   ========================================================= */
(function (root) {
  "use strict";

  var KEY = "rb-misi-dadu-v2";
  var VERSI = 2;

  /* Definisi misi: satu misi = satu bagian LKPD */
  var MISI = [
    { id: 1, judul: "Variabel indikator", sub: "5 lemparan", aturan: 1, target: 5, lkpd: "Bagian A" },
    { id: 2, judul: "Frekuensi & proporsi", sub: "10 lemparan", aturan: 1, target: 10, lkpd: "Bagian B" },
    { id: 3, judul: "Konvergensi & LLN", sub: "100 lemparan", aturan: 1, target: 100, lkpd: "Bagian C" },
    { id: 4, judul: "Parameter p & MLE", sub: "3 aturan × 60 lemparan", aturan: 1, target: 180, lkpd: "Bagian D" },
    { id: 5, judul: "Estimasi gabungan", sub: "data 3 teman", aturan: 1, target: 3, lkpd: "Bagian E" }
  ];

  function def(id) {
    for (var i = 0; i < MISI.length; i++) if (MISI[i].id === id) return MISI[i];
    return null;
  }
  function now() { return new Date().toISOString(); }

  function kosong() {
    return {
      versi: VERSI,
      peserta: { nama: "", email: "" },
      misi: {},
      terakhir: 1,
      dibuat: now(),
      diubah: now()
    };
  }

  /* ---------- baca / tulis ---------- */
  function migrasi(s) {
    if (!s || typeof s !== "object") return kosong();
    if (!s.misi || typeof s.misi !== "object") s.misi = {};
    if (!s.peserta) s.peserta = { nama: "", email: "" };
    if (!s.terakhir) s.terakhir = 1;
    s.versi = VERSI;
    return s;
  }
  function baca() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return kosong();
      return migrasi(JSON.parse(raw));
    } catch (e) { return kosong(); }
  }
  function simpan(s) {
    s.diubah = now();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function hapus() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    return kosong();
  }

  /* ---------- status ---------- */
  function rek(s, id) {
    if (!s.misi[id]) {
      s.misi[id] = {
        status: id === 1 ? "tersedia" : "terkunci",
        aturan: def(id).aturan,
        rolls: [],
        prediksi: null,
        rules: {},     /* khusus misi 4: { "1": [rolls...] } */
        teman: [],      /* khusus misi 5 */
        ts: null
      };
    }
    if (!s.misi[id].rolls) s.misi[id].rolls = [];
    if (!s.misi[id].rules) s.misi[id].rules = {};
    if (!s.misi[id].teman) s.misi[id].teman = [];
    return s.misi[id];
  }

  function status(s, id) {
    var r = s.misi[id];
    if (r && r.status) return r.status;
    return id === 1 ? "tersedia" : "terkunci";
  }

  /* aturan sukses: jumlah sisi teratas yang dihitung sukses.
     aturan 1 -> hanya 6;  2 -> 5,6;  3 -> 4,5,6 */
  function sukses(dadu, aturan) { return dadu >= 7 - aturan; }
  function pAturan(aturan) { return aturan / 6; }

  function hitung(rolls, aturan) {
    var k = 0;
    for (var i = 0; i < rolls.length; i++) if (sukses(rolls[i], aturan)) k++;
    return { n: rolls.length, k: k, phat: rolls.length ? k / rolls.length : 0 };
  }

  function misiSelesai(s, id) {
    var r = rek(s, id);
    if (id === 4) {
      var semua = true;
      [1, 2, 3].forEach(function (a) {
        var arr = r.rules[a] || [];
        if (arr.length < 60) semua = false;
      });
      return semua;
    }
    if (id === 5) {
      return (r.teman || []).filter(function (t) {
        return Number(t.n) > 0 && Number(t.k) >= 0 && Number(t.k) <= Number(t.n);
      }).length >= 3;
    }
    if (id === 3) return r.rolls.length >= 100 && r.prediksi !== null;
    return r.rolls.length >= def(id).target;
  }

  /* tandai selesai + buka misi berikutnya */
  function sinkron(s) {
    MISI.forEach(function (m) {
      var r = rek(s, m.id);
      if (r.status === "terkunci" && m.id === 1) r.status = "tersedia";
      if (misiSelesai(s, m.id) && r.status !== "selesai") {
        r.status = "selesai";
        r.ts = r.ts || now();
        var next = def(m.id + 1);
        if (next) {
          var rn = rek(s, next.id);
          if (rn.status === "terkunci") rn.status = "tersedia";
        }
      }
    });
    return s;
  }

  /* misi yang sedang dikerjakan: tersedia/berjalan paling awal */
  function aktif(s) {
    for (var i = 0; i < MISI.length; i++) {
      var st = status(s, MISI[i].id);
      if (st === "tersedia" || st === "berjalan") return MISI[i].id;
    }
    return 5;
  }
  function jumlahSelesai(s) {
    var c = 0;
    MISI.forEach(function (m) { if (status(s, m.id) === "selesai") c++; });
    return c;
  }
  function sudahMulai(s) {
    /* identitas saja bukan "sudah mulai" — hanya progres yang dihitung */
    for (var i = 1; i <= 5; i++) {
      var r = s.misi[i];
      if (r && ((r.rolls && r.rolls.length) || (r.teman && r.teman.length))) return true;
    }
    return false;
  }

  /* ---------- lempar ---------- */
  function lempar(s, id, jumlah, aturan) {
    var r = rek(s, id);
    var a = aturan || r.aturan || 1;
    for (var i = 0; i < jumlah; i++) {
      var v = 1 + Math.floor(Math.random() * 6);
      if (id === 4) {
        if (!r.rules[a]) r.rules[a] = [];
        r.rules[a].push(v);
      } else {
        r.rolls.push(v);
      }
    }
    if (r.status !== "selesai") r.status = "berjalan";
    s.terakhir = id;
    sinkron(s);
    return simpan(s);
  }

  function ulangi(s, id) {
    var r = rek(s, id);
    r.rolls = [];
    r.rules = {};
    r.status = id === 1 ? "tersedia" : (status(s, id) === "terkunci" ? "terkunci" : "tersedia");
    r.ts = null;
    return simpan(s);
  }

  /* ---------- reset ---------- */
  function resetProgres() {
    var s = baca();
    var peserta = s.peserta;
    var baru = kosong();
    baru.peserta = peserta;      /* nama/email dipertahankan */
    return simpan(baru);
  }
  function resetSemua() { return simpan(kosong()); }

  /* ---------- ekspor / impor ---------- */
  function ekspor(s) {
    return JSON.stringify({ app: "ruang-bernoulli", versi: VERSI, diekspor: now(), progres: s }, null, 2);
  }
  function impor(teks) {
    var obj = JSON.parse(teks);
    var s = obj && obj.progres ? obj.progres : obj;
    if (!s || !s.misi) throw new Error("Berkas ini bukan progres Misi Dadu.");
    return simpan(migrasi(s));
  }

  root.Store = {
    KEY: KEY,
    MISI: MISI,
    def: def,
    baca: baca,
    simpan: simpan,
    hapus: hapus,
    rek: rek,
    status: status,
    sukses: sukses,
    pAturan: pAturan,
    hitung: hitung,
    misiSelesai: misiSelesai,
    sinkron: sinkron,
    aktif: aktif,
    jumlahSelesai: jumlahSelesai,
    sudahMulai: sudahMulai,
    lempar: lempar,
    ulangi: ulangi,
    resetProgres: resetProgres,
    resetSemua: resetSemua,
    ekspor: ekspor,
    impor: impor
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
