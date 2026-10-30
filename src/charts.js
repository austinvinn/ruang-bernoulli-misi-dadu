/* =========================================================
   charts.js — SVG sederhana (tanpa library, tanpa CDN)
   Warna mengikuti palet sage; grafik "empiris" lebih muda.
   ========================================================= */
(function (root) {
  "use strict";

  var C = {
    accent: "#3f6c51",
    soft: "#c9dccb",
    line: "#eef0e9",
    axis: "#cfd5c7",
    tick: "#8d978a",
    text: "#3d4a40",
    ochre: "#8a5e15"
  };

  /* n yang ditanyakan di butir C2 — grafik menandai titik-titik ini */
  var TANDA = [10, 20, 40, 60, 80, 100];

  function f(n, d) { return Number(n).toFixed(d === undefined ? 3 : d); }
  /* angka desimal gaya Indonesia (koma) untuk label grafik */
  function fc(n, d) { return f(n, d).replace(".", ","); }

  /* PMF: batang teoretis (gelap) vs empiris (muda) */
  function pmf(p, phat) {
    var W = 320, H = 118, base = 96, top = 18, scale = 70;
    var vals = [1 - p, p];
    var emp = phat === null || phat === undefined ? null : [1 - phat, phat];
    var groupX = [104, 232];
    var out = "";
    for (var i = 0; i < 2; i++) {
      var h = vals[i] * scale;
      var x = groupX[i] - (emp ? 34 : 17);
      out += '<rect x="' + x + '" y="' + (base - h) + '" width="30" height="' + Math.max(h, 1) +
        '" rx="4" fill="' + C.accent + '"/>' +
        '<text x="' + (x + 15) + '" y="' + (base - h - 5) + '" text-anchor="middle" class="val">' + f(vals[i], 2) + "</text>";
      if (emp) {
        var he = emp[i] * scale;
        out += '<rect x="' + (x + 34) + '" y="' + (base - he) + '" width="30" height="' + Math.max(he, 1) +
          '" rx="4" fill="' + C.soft + '"/>' +
          '<text x="' + (x + 49) + '" y="' + (base - he - 5) + '" text-anchor="middle" class="val">' + f(emp[i], 2) + "</text>";
      }
      out += '<text x="' + groupX[i] + '" y="' + (base + 16) + '" text-anchor="middle" class="tick">X = ' + i + "</text>";
    }
    var grid = "";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      var y = base - v * scale;
      grid += '<line x1="34" y1="' + y + '" x2="' + (W - 6) + '" y2="' + y + '" stroke="' + (v === 0 ? C.axis : C.line) + '"/>';
      grid += '<text x="30" y="' + (y + 3) + '" text-anchor="end" class="tick">' + v.toFixed(2) + "</text>";
    });
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="PMF teoretis dan empiris">' +
      grid +
      '<line x1="34" y1="' + top + '" x2="34" y2="' + base + '" stroke="' + C.axis + '"/>' +
      out +
      '<rect x="40" y="2" width="8" height="8" rx="2" fill="' + C.accent + '"/><text x="52" y="9" class="tick">teoretis</text>' +
      (emp ? '<rect x="104" y="2" width="8" height="8" rx="2" fill="' + C.soft + '"/><text x="116" y="9" class="tick">empiris</text>' : "") +
      "</svg>";
  }

  /* konvergensi p̂ terhadap n.
     Dilengkapi: label kedua sumbu, garis putus-putus dan titik pada
     n = 10, 20, 40, 60, 80, 100 beserta nilai p̂ di titik itu —
     supaya siswa bisa langsung membaca angka yang diminta butir C2.
     Skala tegak menyesuaikan data (bukan selalu 0–1) agar garis tidak
     menempel di dasar grafik. */
  function konvergensi(rolls, aturan, p) {
    var W = 400, H = 258, left = 52, right = W - 14, top = 30, bottom = 206;

    var n = rolls.length;
    /* kumulatif sukses per i supaya titik di n tertentu bisa dihitung */
    var cum = [0], k = 0, maxPh = 0;
    for (var i = 0; i < n; i++) {
      if (rolls[i] >= 7 - aturan) k++;
      cum.push(k);
      if (k / (i + 1) > maxPh) maxPh = k / (i + 1);
    }
    /* batas atas sumbu tegak dan langkah kisi yang "bulat"
       (0,05 / 0,10 / 0,20) supaya label y mudah dibaca */
    var yStep = maxPh <= 0.35 ? 0.05 : (maxPh <= 0.7 ? 0.1 : 0.2);
    var yMax = Math.min(1, Math.ceil((maxPh + 0.02) / yStep) * yStep);
    if (yStep === 0.05) yMax = Math.max(0.3, yMax);
    if (p > yMax) yMax = Math.min(1, Math.ceil((p + 0.02) / yStep) * yStep);
    var xMax = Math.max(n, 10);

    function X(v) { return left + (v / xMax) * (right - left); }
    function Y(ph) { return bottom - (ph / yMax) * (bottom - top); }
    function phatAt(v) { return v > 0 && v <= n ? cum[v] / v : null; }

    /* garis deret p̂ */
    var pts = [], step = Math.max(1, Math.ceil(n / 120));
    for (var j = 1; j <= n; j++) {
      if (j % step === 0 || j === n) pts.push(X(j).toFixed(1) + "," + Y(cum[j] / j).toFixed(1));
    }

    var out = "";

    /* kisi & label sumbu tegak (p̂) per langkah tetap */
    (function () {
      var nTick = Math.round(yMax / yStep);
      for (var t = 0; t <= nTick; t++) {
        var v = t * yStep;
        var gy = Y(v);
        out += '<line x1="' + left + '" y1="' + gy + '" x2="' + right + '" y2="' + gy + '" stroke="' +
          (t === 0 ? C.axis : C.line) + '"/>' +
          '<text x="' + (left - 7) + '" y="' + (gy + 4) + '" text-anchor="end" class="tick">' + fc(v, 2) + "</text>";
      }
    })();

    /* sumbu tegak + judulnya */
    out += '<line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + bottom + '" stroke="' + C.axis + '"/>';
    out += '<text x="14" y="' + ((top + bottom) / 2) + '" text-anchor="middle" class="g-lbl" ' +
      'transform="rotate(-90 14 ' + ((top + bottom) / 2) + ')">p\u0302 (proporsi sukses)</text>';

    /* garis p teoretis */
    var yp = Y(p);
    out += '<line x1="' + left + '" y1="' + yp + '" x2="' + right + '" y2="' + yp + '" stroke="' +
      C.soft + '" stroke-width="1.4" stroke-dasharray="5 4"/>' +
      '<text x="' + (right - 2) + '" y="' + Math.max(top + 9, yp - 6) + '" text-anchor="end" class="g-lbl">p = ' +
      fc(p, 3) + "</text>";

    /* deret p̂ */
    out += n
      ? '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + C.accent +
        '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<text x="' + ((left + right) / 2) + '" y="' + ((top + bottom) / 2) +
        '" text-anchor="middle" class="tick">belum ada lemparan</text>';

    /* tanda di n yang ditanyakan: garis putus-putus tegak + titik + nilainya */
    var tanda = TANDA.filter(function (v) { return v <= n; });
    if (!tanda.length && n > 0) tanda = [n];
    tanda.forEach(function (v, idx) {
      var ph = phatAt(v);
      if (ph === null) return;
      var px = X(v), py = Y(ph);
      out += '<line x1="' + px.toFixed(1) + '" y1="' + bottom + '" x2="' + px.toFixed(1) + '" y2="' + py.toFixed(1) +
        '" stroke="' + C.axis + '" stroke-dasharray="3 3"/>' +
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="4.2" class="g-dot"/>' +
        '<text x="' + px.toFixed(1) + '" y="' + (idx % 2 ? py + 17 : py - 9).toFixed(1) +
        '" text-anchor="middle" class="g-val">' + fc(ph, 3) + "</text>" +
        '<text x="' + px.toFixed(1) + '" y="' + (bottom + 16) +
        '" text-anchor="middle" class="tick">' + v + "</text>";
    });

    /* sumbu datar + judulnya */
    out += '<line x1="' + left + '" y1="' + bottom + '" x2="' + right + '" y2="' + bottom + '" stroke="' + C.axis + '"/>' +
      '<text x="' + ((left + right) / 2) + '" y="' + (bottom + 34) +
      '" text-anchor="middle" class="g-lbl">n (jumlah lemparan) \u2192</text>';

    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Grafik proporsi sukses terhadap jumlah lemparan">' +
      out + "</svg>";
  }

  /* tiga batang p teoretis untuk misi 4 */
  function aturanBars(hasil) {
    var W = 320, H = 116, base = 92, top = 20, scale = 62;
    var out = "";
    hasil.forEach(function (h, i) {
      var x = 46 + i * 92;
      var hh = h.p * scale;
      out += '<rect x="' + x + '" y="' + (base - hh) + '" width="46" height="' + Math.max(hh, 1) + '" rx="5" fill="' + (i === 0 ? C.accent : C.soft) + '"/>' +
        '<text x="' + (x + 23) + '" y="' + (base - hh - 5) + '" text-anchor="middle" class="val">' + fc(h.p, 3) + "</text>" +
        '<text x="' + (x + 23) + '" y="' + (base + 22) + '" text-anchor="middle" class="tick">' + h.label + "</text>";
    });
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Peluang untuk tiga aturan sukses">' +
      '<line x1="26" y1="' + base + '" x2="' + (W - 8) + '" y2="' + base + '" stroke="' + C.axis + '"/>' +
      '<line x1="26" y1="' + top + '" x2="26" y2="' + base + '" stroke="' + C.axis + '"/>' +
      out + "</svg>";
  }

  root.Charts = { pmf: pmf, konvergensi: konvergensi, aturanBars: aturanBars, TANDA: TANDA };
})(typeof globalThis !== "undefined" ? globalThis : this);
