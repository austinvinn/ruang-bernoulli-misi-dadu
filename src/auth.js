/* =========================================================
   auth.js — gerbang kode akses + sesi server.
   Mode:
     "server"  : API hidup, sesi sah (peran siswa/dev/baca)
     "masuk"   : API hidup, belum masuk -> tampilkan layar kode
     "lokal"   : API tidak ada (python -m http.server / file://) -> jalan tanpa gerbang
     "galat"   : API hidup tapi bermasalah -> tampilkan pesan, jangan biarkan lewat
   ========================================================= */
(function (root) {
  "use strict";

  var CACHE = "rb-sesi-v1";
  var sesi = {
    siap: false, mode: "memuat", peran: null, kelas: "", nama: "", nim: "", id: null,
    jawabanServer: null, galat: null
  };
  var lanjut = null;
  var sibuk = false;

  function api(jalur, opsi) {
    opsi = opsi || {};
    opsi.credentials = "same-origin";
    if (opsi.body && !opsi.headers) opsi.headers = { "content-type": "application/json" };
    return fetch(jalur, opsi).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
        return { status: r.status, ok: r.ok, data: data };
      });
    });
  }

  function lokalSaja() {
    var h = location.hostname;
    return location.protocol === "file:" || h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  }

  function simpanCache() {
    try {
      localStorage.setItem(CACHE, JSON.stringify({ peran: sesi.peran, kelas: sesi.kelas, id: sesi.id }));
    } catch (e) { /* mode privat */ }
  }

  function cek() {
    return api("/api/saya", { method: "GET" })
      .then(function (r) {
        sesi.siap = true;
        if (r.ok && r.data && r.data.ok) {
          sesi.mode = "server";
          sesi.peran = r.data.peran;
          sesi.kelas = r.data.kelas || "";
          sesi.id = (r.data.peserta && r.data.peserta.id) || null;
          sesi.nama = (r.data.peserta && r.data.peserta.nama) || "";
          sesi.nim = (r.data.peserta && r.data.peserta.nim) || "";
          sesi.jawabanServer = r.data.jawaban || {};
          simpanCache();
          return sesi;
        }
        if (r.status === 401) { sesi.mode = "masuk"; return sesi; }
        sesi.mode = lokalSaja() ? "lokal" : "galat";
        sesi.galat = (r.data && r.data.galat) || ("Server menjawab " + r.status + ".");
        return sesi;
      })
      .catch(function () {
        sesi.siap = true;
        sesi.mode = lokalSaja() ? "lokal" : "galat";
        sesi.galat = "Tidak bisa menghubungi server.";
        return sesi;
      });
  }

  /* ---------------- layar gerbang ---------------- */
  function layarMasuk(pesan, galat) {
    var app = document.getElementById("app");
    if (!app) return;
    var kelasku = "";
    try { kelasku = (JSON.parse(localStorage.getItem(CACHE) || "{}") || {}).kelas || ""; } catch (e) {}
    app.innerHTML =
      '<header class="bar"><div class="mark" aria-hidden="true">⚄</div>' +
      '<div class="brand"><div><div class="brand-name">Ruang Bernoulli</div>' +
      '<div class="brand-sub"><span>LKM digital · Statistika Matematika</span></div></div></div></header>' +
      '<main class="body">' +
      '<div class="hero"><div class="eyebrow">Masuk ke lembar kerja</div>' +
      '<h2 class="title">Masukkan kode akses</h2>' +
      '<p class="sub">Kode dibagikan oleh pengembang kelas. Tanpa kode, jawabanmu tidak bisa dikumpulkan ke dosen.</p></div>' +
      '<div class="panel">' +
      '<label class="lab-kode" for="kodeMasuk">Kode akses kelas</label>' +
      '<input class="inp inp-kode" id="kodeMasuk" inputmode="text" autocomplete="off" spellcheck="false" ' +
      'placeholder="DADU-9A-XXXX" aria-label="Kode akses" value="' + (kelasku ? "" : "") + '">' +
      '<p class="note" id="kodeGalat" role="alert">' + (galat || "Huruf besar/kecil dan tanda hubung tidak berpengaruh.") + "</p>" +
      '<button class="btn btn-primary" data-masuk="1"' + (sibuk ? " disabled" : "") + '>Masuk &nbsp;→</button>' +
      '<p class="note center" style="margin-top:10px">Lupa kode? Hubungi anggota Kelompok 9. ' +
      'Pengembang: buka <a href="rekap.html">halaman rekap</a>.</p>' +
      "</div></main>";
    var inp = document.getElementById("kodeMasuk");
    if (inp) {
      inp.focus();
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); kirimKode(); }
      });
    }
    var tombol = app.querySelector("[data-masuk]");
    if (tombol) tombol.addEventListener("click", kirimKode);
    if (pesan) {
      var g = document.getElementById("kodeGalat");
      if (g) g.textContent = pesan;
    }
  }

  function kirimKode() {
    if (sibuk) return;
    var inp = document.getElementById("kodeMasuk");
    var g = document.getElementById("kodeGalat");
    var kode = inp ? inp.value.trim() : "";
    if (kode.length < 4) {
      if (g) g.textContent = "Tulis kode akses dulu.";
      return;
    }
    sibuk = true;
    if (g) { g.textContent = "Memeriksa kode…"; g.classList.remove("bad"); }
    api("/api/masuk", { method: "POST", body: JSON.stringify({ kode: kode }) })
      .then(function (r) {
        sibuk = false;
        if (r.ok && r.data && r.data.ok) {
          sesi.mode = "server";
          sesi.peran = r.data.peran;
          sesi.kelas = r.data.kelas || "";
          sesi.id = r.data.id || null;
          simpanCache();
          if (sesi.peran === "dev" || sesi.peran === "baca") { location.href = "rekap.html"; return; }
          if (typeof lanjut === "function") lanjut(sesi);
          return;
        }
        var pesan = (r.data && r.data.galat) || "Kode tidak dikenali.";
        if (g) { g.textContent = pesan; g.classList.add("bad"); }
        if (inp) inp.select();
      })
      .catch(function () {
        sibuk = false;
        if (g) { g.textContent = "Tidak bisa menghubungi server. Periksa koneksi."; g.classList.add("bad"); }
      });
  }

  function layarGalat() {
    var app = document.getElementById("app");
    if (!app) return;
    app.innerHTML =
      '<main class="body"><div class="hero"><div class="eyebrow">Server</div>' +
      '<h2 class="title">Server pengumpulan belum bisa dihubungi</h2>' +
      '<p class="sub">' + (sesi.galat || "") + " Jawabanmu tetap aman di perangkat ini, tetapi belum bisa dikirim. Coba muat ulang beberapa saat lagi.</p>" +
      '</div><div class="panel"><button class="btn btn-primary" onclick="location.reload()">Coba lagi</button></div></main>';
  }

  function mulai(fn) {
    lanjut = fn;
    return cek().then(function (s) {
      /* kode pengembang tidak dipakai di halaman siswa */
      if (s.mode === "server" && (s.peran === "dev" || s.peran === "baca")) {
        location.replace("rekap.html");
        return s;
      }
      if (s.mode === "server") { if (typeof fn === "function") fn(s); return s; }
      if (s.mode === "masuk") { layarMasuk(""); return s; }
      if (s.mode === "galat") { layarGalat(); return s; }
      if (typeof fn === "function") fn(s);   /* lokal */
      return s;
    });
  }

  function keluar() {
    return api("/api/keluar", { method: "POST" }).catch(function () {}).then(function () {
      try { localStorage.removeItem(CACHE); } catch (e) {}
      sesi.peran = null;
      sesi.mode = "masuk";
      layarMasuk("Kamu sudah keluar.");
    });
  }

  root.Auth = {
    mulai: mulai,
    cek: cek,
    keluar: keluar,
    layarMasuk: layarMasuk,
    api: api,
    data: function () { return sesi; },
    aktif: function () { return sesi.mode === "server"; },
    pakaiGerbang: function () { return sesi.mode !== "lokal"; },
    peran: function () { return sesi.peran; },
    label: function () {
      if (sesi.mode !== "server") return "";
      return sesi.kelas ? "Kelas " + sesi.kelas : "";
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
