/* =========================================================
   sinkron.js — outbox: jawaban dikirim ke server tanpa
   menghilangkan data luring. localStorage tetap sumber kebenaran.
   ========================================================= */
(function (root) {
  "use strict";

  var S = root.Store;
  var A = root.Auth;
  var antre = {};
  var timer = null;
  var sibuk = false;
  var keadaan = { tertunda: 0, terakhir: null, galat: null, mencoba: false };
  var MAP_MISI = { A: 1, B: 2, C: 3, D: 4, E: 5 };

  function bagianDari(id) { return String(id || "").charAt(0); }
  function jumlah() { return Object.keys(antre).length; }
  function jadwal(ms) { clearTimeout(timer); timer = setTimeout(kirim, ms); }

  function lapor() {
    keadaan.tertunda = jumlah();
    var el = document.getElementById("statusSimpan");
    if (!el) return;
    var jam = keadaan.terakhir ? new Date(keadaan.terakhir).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
    if (!A || !A.aktif()) {
      el.innerHTML = '<i class="dot-ok"></i> Tersimpan di perangkat ini';
      el.classList.remove("bad");
      return;
    }
    if (keadaan.tertunda > 0) {
      el.innerHTML = '<i class="dot-wait"></i> ' + keadaan.tertunda + " jawaban menunggu dikirim" +
        (navigator.onLine === false ? " · luring" : "");
      el.classList.add("bad");
      return;
    }
    el.innerHTML = '<i class="dot-ok"></i> Tersimpan ke server' + (jam ? " · " + jam : "");
    el.classList.remove("bad");
  }

  function tandai(id) {
    if (!id) return;
    antre[id] = 1;
    lapor();
    jadwal(1200);
  }

  function kirim() {
    if (sibuk) return;
    if (!S || !A || !A.aktif()) { lapor(); return; }
    var ids = Object.keys(antre);
    if (!ids.length) { lapor(); return; }
    if (navigator.onLine === false) { lapor(); return; }

    var st = S.baca();
    var paket = ids.slice(0, 20);
    var bagian = bagianDari(paket[0]);
    var misi = MAP_MISI[bagian] || 1;
    var r = S.rek(st, misi);
    var deret = misi === 4 ? ((r.rules && r.rules[1]) || []) : (r.rolls || []);

    sibuk = true;
    keadaan.mencoba = true;
    A.api("/api/jawaban", {
      method: "POST",
      body: JSON.stringify({
        nama: st.peserta.nama || "",
        nim: st.peserta.nim || "",
        butir: paket.map(function (id) { return { id: id, nilai: S.jawabNilai(st, id) }; }),
        lemparan: { bagian: bagian, deret: deret }
      })
    }).then(function (res) {
      sibuk = false;
      keadaan.mencoba = false;
      if (res.ok && res.data && res.data.ok) {
        keadaan.terakhir = res.data.waktu || new Date().toISOString();
        keadaan.galat = null;
        paket.forEach(function (id) {
          delete antre[id];
          st.kirim[id] = { ts: keadaan.terakhir, ok: true };
        });
        S.simpan(st);
        lapor();
        if (jumlah()) jadwal(500);
        return;
      }
      keadaan.galat = (res.data && res.data.galat) || ("Server menjawab " + res.status);
      lapor();
      jadwal(res.status === 429 ? 20000 : 8000);
    }).catch(function (e) {
      sibuk = false;
      keadaan.mencoba = false;
      keadaan.galat = e && e.message ? e.message : "jaringan";
      lapor();
      jadwal(10000);
    });
  }

  /* nama/NIM sering diisi setelah butir pertama terkirim: kirim ulang identitas saja */
  var timerIdent = null;
  function identitas() {
    if (!A || !A.aktif()) return;
    clearTimeout(timerIdent);
    timerIdent = setTimeout(function () {
      var st = S.baca();
      if (!st.peserta.nama && !st.peserta.nim) return;
      A.api("/api/jawaban", {
        method: "POST",
        body: JSON.stringify({ nama: st.peserta.nama || "", nim: st.peserta.nim || "", butir: [] })
      }).then(function (res) {
        if (res.ok && res.data && res.data.ok) {
          keadaan.terakhir = res.data.waktu || new Date().toISOString();
          lapor();
        }
      }).catch(function () { /* dicoba lagi saat butir berikutnya disimpan */ });
    }, 1200);
  }

  /* dorong semua jawaban lokal setelah masuk (mis. pindah perangkat) */
  function kirimSemua() {
    var st = S.baca();
    Object.keys(st.jawaban || {}).forEach(function (id) { antre[id] = 1; });
    lapor();
    if (jumlah()) jadwal(300);
  }

  function mulai() {
    window.addEventListener("online", function () { lapor(); jadwal(400); });
    window.addEventListener("offline", lapor);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && jumlah()) kirim();
    });
    if (A && A.aktif()) kirimSemua();
    lapor();
  }

  root.Sinkron = {
    tandai: tandai,
    identitas: identitas,
    kirim: kirim,
    kirimSemua: kirimSemua,
    mulai: mulai,
    jumlah: jumlah,
    keadaan: function () { return keadaan; },
    lapor: lapor
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
