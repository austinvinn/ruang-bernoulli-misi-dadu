/* =========================================================
   store.js — progres belajar "Ruang Bernoulli: Misi Dadu" (v4)
   Satu percobaan = satu lemparan. Tidak ada ulangan, tidak ada
   hitungan frekuensi: peluang dihitung dari banyaknya sisi.
   Sumber kebenaran = localStorage.
   ========================================================= */
(function (root) {
  "use strict";

  var KEY = "rb-misi-dadu-v4";
  var VERSI = 4;

  /* Definisi misi. dadu = 1 | 2 | 0 (tanpa lemparan). */
  var MISI = [
    { id: 1, judul: "Satu lemparan, dua hasil", sub: "1 dadu · 1 lemparan", dadu: 1, target: 1, lkpd: "Bagian A" },
    { id: 2, judul: "Ganti aturan, ganti peluang", sub: "1 dadu · aturan pilihanmu", dadu: 1, target: 1, lkpd: "Bagian B" },
    { id: 3, judul: "Dua dadu, tetap dua hasil", sub: "2 dadu · 1 lemparan", dadu: 2, target: 1, lkpd: "Bagian C" },
    { id: 4, judul: "Menemukan rumus peluangnya", sub: "tanpa lemparan baru", dadu: 0, target: 0, lkpd: "Bagian D" },
    { id: 5, judul: "Rancang sendiri, lalu simpulkan", sub: "1 dadu · aturan buatanmu", dadu: 1, target: 1, lkpd: "Bagian E" }
  ];

  var ATURAN_A = { jenis: "angka", n: 6 };

  function def(id) {
    for (var i = 0; i < MISI.length; i++) if (MISI[i].id === id) return MISI[i];
    return null;
  }
  function now() { return new Date().toISOString(); }

  function kosong() {
    return {
      versi: VERSI,
      peserta: { nama: "", nim: "", kelas: "" },
      jawaban: {},     /* { "A1": { v: nilai, ts: iso } } */
      kirim: {},       /* status kirim ke server per butir */
      misi: {},
      terakhir: 1,
      dibuat: now(),
      diubah: now(),
      /* watermark: waktu terakhir data dikosongkan di perangkat ini.
         Jawaban server yang lebih tua dari ini tidak boleh disalin balik
         (lihat gabungJawabanServer di app.js). */
      dibersihkan: null
    };
  }

  /* ---------- baca / tulis ---------- */
  function migrasi(s) {
    if (!s || typeof s !== "object") return kosong();
    if (!s.misi || typeof s.misi !== "object") s.misi = {};
    if (!s.peserta) s.peserta = {};
    if (typeof s.peserta.nama !== "string") s.peserta.nama = "";
    if (typeof s.peserta.nim !== "string") s.peserta.nim = "";
    if (typeof s.peserta.kelas !== "string") s.peserta.kelas = "";
    if (!s.jawaban || typeof s.jawaban !== "object") s.jawaban = {};
    if (!s.kirim || typeof s.kirim !== "object") s.kirim = {};
    if (!s.terakhir) s.terakhir = 1;
    if (typeof s.dibersihkan === "undefined") s.dibersihkan = null;
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
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* mode privat */ }
    return s;
  }
  function hapus() {
    try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    return kosong();
  }

  /* ---------- aturan sukses ----------
     Satu aturan mempartisi ruang hasil jadi dua kelompok:
       {jenis:"angka", n}        muncul angka tertentu        (1 dadu)
       {jenis:"ganjil"} / {jenis:"genap"}                     (1 dadu)
       {jenis:"min", n}          muncul >= n                  (1 dadu)
       {jenis:"maks", n}         muncul <= n                  (1 dadu)
       {jenis:"jumlah", mode}    dua dadu: "genap" | "ganjil" | "sama"
       {jenis:"jumlah", mode:"sama", n:7}
  */
  function cocok(hasil, at) {
    if (!at || !hasil || !hasil.length) return false;
    var v = hasil[0];
    switch (at.jenis) {
      case "angka": return hasil.length === 1 && v === at.n;
      case "ganjil": return hasil.length === 1 && v % 2 === 1;
      case "genap": return hasil.length === 1 && v % 2 === 0;
      case "min": return hasil.length === 1 && v >= at.n;
      case "maks": return hasil.length === 1 && v <= at.n;
      case "jumlah": {
        if (hasil.length !== 2) return false;
        var j = hasil[0] + hasil[1];
        if (at.mode === "ganjil") return j % 2 === 1;
        if (at.mode === "genap") return j % 2 === 0;
        return j === at.n;
      }
    }
    return false;
  }

  function ruang(at) {
    var out = [], a, b;
    if (at && at.jenis === "jumlah") {
      for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) out.push([a, b]);
      return out;
    }
    for (a = 1; a <= 6; a++) out.push([a]);
    return out;
  }
  /* |A|: banyak hasil yang dihitung sukses */
  function sisiSukses(at) {
    var r = ruang(at), c = 0;
    for (var i = 0; i < r.length; i++) if (cocok(r[i], at)) c++;
    return c;
  }
  /* |Omega|: 6 untuk satu dadu, 36 untuk dua dadu */
  function ruangTotal(at) { return at && at.jenis === "jumlah" ? 36 : 6; }
  /* peluang sukses menurut banyaknya sisi, bukan menurut data lemparan */
  function peluang(at) { return at ? sisiSukses(at) / ruangTotal(at) : 0; }

  function label(at) {
    if (!at) return "—";
    switch (at.jenis) {
      case "angka": return "muncul angka " + at.n;
      case "ganjil": return "muncul angka ganjil";
      case "genap": return "muncul angka genap";
      case "min": return "muncul " + at.n + " atau lebih";
      case "maks": return "muncul " + at.n + " atau kurang";
      case "jumlah":
        if (at.mode === "genap") return "jumlah kedua dadu genap";
        if (at.mode === "ganjil") return "jumlah kedua dadu ganjil";
        return "jumlah kedua dadu = " + at.n;
    }
    return "—";
  }

  /* ---------- status ---------- */
  function rek(s, id) {
    var d = def(id);
    if (!s.misi[id]) {
      s.misi[id] = {
        status: id === 1 ? "tersedia" : "terkunci",
        aturan: id === 1 ? ATURAN_A : null,
        hasil: null,      /* hasil lemparan terakhir: [d1] atau [d1, d2] */
        riwayat: [],      /* maksimal 5 hasil terakhir, pengamatan saja */
        ts: null
      };
    }
    var r = s.misi[id];
    if (typeof r.aturan === "undefined") r.aturan = id === 1 ? ATURAN_A : null;
    if (!r.hasil) r.hasil = null;
    if (!r.riwayat) r.riwayat = [];
    if (id === 1) r.aturan = r.aturan || ATURAN_A;
    if (d && d.dadu === 0) r.aturan = null;
    return r;
  }

  function status(s, id) {
    var r = s.misi[id];
    if (r && r.status) return r.status;
    return id === 1 ? "tersedia" : "terkunci";
  }

  /* ---------- jawaban butir LKM ---------- */
  function jawab(s, id, nilai) {
    if (!s.jawaban) s.jawaban = {};
    s.jawaban[id] = { v: nilai, ts: now() };
    if (s.kirim) delete s.kirim[id];
    return simpan(s);
  }
  function jawabNilai(s, id) {
    var j = s.jawaban && s.jawaban[id];
    return j ? j.v : null;
  }
  function adaJawaban(s, id) {
    if (!root.LKM || typeof root.LKM.butirTerisi !== "function") {
      var v = jawabNilai(s, id);
      return v !== null && v !== undefined && String(v).trim() !== "";
    }
    return root.LKM.butirTerisi(id, jawabNilai(s, id));
  }
  function jumlahJawaban(s, kode) {
    if (!root.LKM || typeof root.LKM.bagian !== "function") return { terisi: 0, total: 0 };
    var b = root.LKM.bagian(kode);
    if (!b) return { terisi: 0, total: 0 };
    var terisi = 0;
    b.butir.forEach(function (bt) { if (adaJawaban(s, bt.id)) terisi++; });
    return { terisi: terisi, total: b.butir.length };
  }

  function percobaanSelesai(s, id) {
    var d = def(id);
    if (!d) return false;
    if (d.dadu === 0) return true;          /* Misi D tidak melempar */
    var r = rek(s, id);
    return !!(r.hasil && r.hasil.length);
  }

  function misiSelesai(s, id) {
    return percobaanSelesai(s, id) && lkmLengkap(s, id);
  }

  /* semua butir LKM bagian ini sudah terjawab? (LKM dimuat setelah store) */
  function lkmLengkap(s, id) {
    var L = root.LKM;
    if (!L || typeof L.jawabanLengkapMisi !== "function") return true;
    return L.jawabanLengkapMisi(s, id);
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
    for (var i = 1; i <= 5; i++) {
      var r = s.misi[i];
      if (r && ((r.riwayat && r.riwayat.length) || (r.hasil && r.hasil.length))) return true;
    }
    for (var k in (s.jawaban || {})) {
      if (Object.prototype.hasOwnProperty.call(s.jawaban, k)) return true;
    }
    return false;
  }

  /* ---------- aturan ---------- */
  function pilihAturan(s, id, at) {
    if (status(s, id) === "terkunci") return simpan(s);
    var d = def(id);
    if (!d || d.dadu === 0) return simpan(s);
    var r = rek(s, id);
    r.aturan = at;
    return simpan(s);
  }

  /* Bagian A: butir A1 (prediksi) wajib terisi lebih dulu, sejalan dengan
     penjagaan tombol lempar di app.js. */
  function prediksiA1(s) {
    var v = jawabNilai(s, "A1");
    return v !== null && v !== undefined && String(v).trim() !== "";
  }

  /* ---------- lempar: SATU percobaan = SATU lemparan ---------- */
  function lempar(s, id, aturan) {
    if (status(s, id) === "terkunci") return simpan(s);   /* jangan menembus kunci */
    var d = def(id);
    if (!d || d.dadu === 0) return simpan(s);             /* Misi D tidak melempar */
    if (id === 1 && !prediksiA1(s)) return simpan(s);     /* isi tebakan dulu */
    var r = rek(s, id);
    var at = aturan || r.aturan || (id === 1 ? ATURAN_A : null);
    if (!at) return simpan(s);                            /* aturan harus dipilih dulu */
    r.aturan = at;

    var hasil = [];
    for (var i = 0; i < d.dadu; i++) hasil.push(1 + Math.floor(Math.random() * 6));
    r.hasil = hasil;
    r.riwayat.unshift(hasil);
    if (r.riwayat.length > 5) r.riwayat = r.riwayat.slice(0, 5);
    if (r.status !== "selesai") r.status = "berjalan";
    s.terakhir = id;
    sinkron(s);
    return simpan(s);
  }

  function ulangi(s, id) {
    var r = rek(s, id);
    r.hasil = null;
    r.riwayat = [];
    r.status = status(s, id) === "terkunci" ? "terkunci" : "tersedia";
    r.ts = null;
    return simpan(s);
  }

  /* ---------- reset ---------- */
  function resetProgres() {
    var s = baca();
    var peserta = s.peserta;
    var baru = kosong();
    baru.peserta = peserta;      /* nama/NIM dipertahankan */
    baru.dibersihkan = now();    /* blokir salin-balik jawaban server yang lama */
    return simpan(baru);
  }
  function resetSemua() {
    var baru = kosong();
    baru.dibersihkan = now();
    return simpan(baru);
  }

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
    VERSI: VERSI,
    MISI: MISI,
    def: def,
    baca: baca,
    simpan: simpan,
    hapus: hapus,
    rek: rek,
    status: status,
    cocok: cocok,
    sisiSukses: sisiSukses,
    ruangTotal: ruangTotal,
    peluang: peluang,
    label: label,
    misiSelesai: misiSelesai,
    percobaanSelesai: percobaanSelesai,
    jawab: jawab,
    jawabNilai: jawabNilai,
    adaJawaban: adaJawaban,
    jumlahJawaban: jumlahJawaban,
    sinkron: sinkron,
    aktif: aktif,
    jumlahSelesai: jumlahSelesai,
    sudahMulai: sudahMulai,
    pilihAturan: pilihAturan,
    prediksiA1: prediksiA1,
    lempar: lempar,
    ulangi: ulangi,
    resetProgres: resetProgres,
    resetSemua: resetSemua,
    ekspor: ekspor,
    impor: impor
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
