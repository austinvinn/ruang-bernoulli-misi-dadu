/* =========================================================
   laporan.js — codec "kode laporan" untuk Misi Dadu
   ---------------------------------------------------------
   Tujuan: mahasiswa menyalin 7 karakter dari game ke LKPD,
   pengembang menempelkannya di /rekap untuk mendapat data kelas
   tanpa server, tanpa login, tanpa database.

   Format kode : XXXX-EFG  (7 karakter Crockford base32)
   Isi payload : versi(2) misi(3) aturan(3) n(10) k(10) crc8
                 = 36 bit; bit tertinggi selalu 0 -> 7 karakter

   aturan = banyaknya sisi dadu yang dihitung sukses (1..6)
            0 = tidak dipakai (misal lemparan manual misi 1)
   Toleransi tulis tangan: O->0, I/L->1, U->0, huruf kecil, spasi,
   dan prefix "MD6-" opsional.
   ========================================================= */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Laporan = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  var MAP = {};
  for (var i = 0; i < ALPHABET.length; i++) MAP[ALPHABET[i]] = i;
  // toleransi salah baca huruf yang mirip angka
  MAP.O = 0;
  MAP.U = 0;
  MAP.I = 1;
  MAP.L = 1;

  function crc8(bytes) {
    var c = 0;
    for (var i = 0; i < bytes.length; i++) {
      c ^= bytes[i] & 0xff;
      for (var b = 0; b < 8; b++) {
        c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff;
      }
    }
    return c & 0xff;
  }

  function peluangAturan(aturan) {
    if (!aturan) return null;
    return aturan / 6;
  }

  function encode(input) {
    var misi = Number(input && input.misi);
    var aturan = Number((input && input.aturan) || 0);
    var n = Number(input && input.n);
    var k = Number(input && input.k);

    if (!Number.isInteger(misi) || misi < 1 || misi > 7) {
      throw new RangeError("misi harus bilangan bulat 1..7");
    }
    if (!Number.isInteger(aturan) || aturan < 0 || aturan > 7) {
      throw new RangeError("aturan harus bilangan bulat 0..7");
    }
    if (!Number.isInteger(n) || n < 0 || n > 1023) {
      throw new RangeError("n harus bilangan bulat 0..1023");
    }
    if (!Number.isInteger(k) || k < 0 || k > n) {
      throw new RangeError("k harus bilangan bulat 0..n");
    }

    var byte0 = (1 << 6) | (misi << 3) | aturan; // versi=1
    var value = byte0 * 0x100000 + n * 1024 + k; // 28 bit
    var bytes = [
      (value / 0x1000000) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    ];
    var bits = value * 256 + crc8(bytes); // 36 bit

    var out = "";
    for (var p = 6; p >= 0; p--) {
      out += ALPHABET[Math.floor(bits / Math.pow(32, p)) % 32];
    }
    return out.slice(0, 4) + "-" + out.slice(4);
  }

  function decode(raw) {
    if (typeof raw !== "string") return { ok: false, error: "kode bukan teks" };
    var clean = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (clean.indexOf("MD6") === 0 && clean.length > 7) clean = clean.slice(3);
    if (clean.length !== 7) {
      return { ok: false, error: "kode harus 7 karakter (didapat " + clean.length + ")" };
    }

    var bits = 0;
    for (var i = 0; i < 7; i++) {
      var v = MAP[clean[i]];
      if (v === undefined) return { ok: false, error: "karakter tidak dikenal: " + clean[i] };
      bits = bits * 32 + v;
    }

    var crc = bits % 256;
    var value = Math.floor(bits / 256);
    var bytes = [
      (value / 0x1000000) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    ];
    if (crc8(bytes) !== crc) {
      return { ok: false, error: "kode tidak valid (checksum gagal) — cek salah tulis" };
    }

    var byte0 = Math.floor(value / 0x100000);
    var versi = byte0 >>> 6;
    var misi = (byte0 >>> 3) & 7;
    var aturan = byte0 & 7;
    var n = Math.floor(value / 1024) % 1024;
    var k = value % 1024;

    if (versi !== 1) return { ok: false, error: "versi kode tidak dikenali (" + versi + ")" };
    if (k > n) return { ok: false, error: "data tidak konsisten (k > n)" };

    return {
      ok: true,
      versi: versi,
      misi: misi,
      aturan: aturan,
      n: n,
      k: k,
      phat: n ? k / n : 0,
      p: peluangAturan(aturan),
      code: format(clean)
    };
  }

  function format(clean) {
    var c = String(clean).toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (c.indexOf("MD6") === 0 && c.length > 7) c = c.slice(3);
    return c.slice(0, 4) + "-" + c.slice(4);
  }

  /* Satu baris = satu kode, label opsional:
       "ABCD-EFG"
       "ABCD-EFG Rani"
       "ABCD-EFG, Rani"
       "abcd efg - Rani"
     Mengembalikan { entries:[], invalid:[] } */
  function parseMany(text) {
    var entries = [];
    var invalid = [];
    String(text || "")
      .split(/\r?\n/)
      .forEach(function (line, idx) {
        var s = line.trim();
        if (!s) return;
        var m = s.match(/^((?:MD6-?)?[0-9A-Za-z]{4}-?[0-9A-Za-z]{3})\b/);
        if (!m) {
          invalid.push({ line: idx + 1, raw: s, error: "tidak ada kode di baris ini" });
          return;
        }
        var code = m[1];
        var label = s.slice(m[0].length).replace(/^[\s,\-–—|;\t]+/, "").trim();
        var res = decode(code);
        res.label = label || "";
        res.raw = code;
        if (res.ok) entries.push(res);
        else invalid.push({ line: idx + 1, raw: s, error: res.error });
      });
    return { entries: entries, invalid: invalid };
  }

  /* Gabungan data: Sigma k / Sigma n (bukan rata-rata p-hat) */
  function pool(entries) {
    var n = 0, k = 0;
    entries.forEach(function (e) { n += e.n; k += e.k; });
    var p = 0;
    var withP = entries.filter(function (e) { return typeof e.p === "number"; });
    if (withP.length) p = withP[0].p;
    var phat = n ? k / n : 0;
    var se = n && p ? Math.sqrt((p * (1 - p)) / n) : null;
    return { n: n, k: k, phat: phat, p: p || null, peserta: entries.length, se: se };
  }

  function unduhJSON(nama, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  return {
    encode: encode,
    decode: decode,
    format: format,
    parseMany: parseMany,
    pool: pool,
    peluangAturan: peluangAturan,
    unduhJSON: unduhJSON,
    ALPHABET: ALPHABET
  };
});
