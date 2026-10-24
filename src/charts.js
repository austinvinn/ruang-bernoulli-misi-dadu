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

  function f(n, d) { return Number(n).toFixed(d === undefined ? 3 : d); }

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

  /* konvergensi p̂ terhadap n */
  function konvergensi(rolls, aturan, p) {
    var W = 320, H = 116, left = 34, right = W - 8, top = 16, bottom = 92;
    var n = rolls.length;
    var pts = [];
    var k = 0;
    var step = Math.max(1, Math.ceil(n / 70));
    for (var i = 0; i < n; i++) {
      if (rolls[i] >= 7 - aturan) k++;
      if ((i + 1) % step === 0 || i === n - 1) {
        var ph = k / (i + 1);
        pts.push((left + (i + 1) / Math.max(n, 1) * (right - left)).toFixed(1) + "," +
                 (bottom - ph * (bottom - top)).toFixed(1));
      }
    }
    var y = bottom - p * (bottom - top);
    var body = n
      ? '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + C.accent + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<text x="' + ((left + right) / 2) + '" y="' + ((top + bottom) / 2) + '" text-anchor="middle" class="tick">belum ada lemparan</text>';
    var ticks = "";
    [0, 0.5, 1].forEach(function (v) {
      var gy = bottom - v * (bottom - top);
      ticks += '<line x1="' + left + '" y1="' + gy + '" x2="' + right + '" y2="' + gy + '" stroke="' + (v === 0 ? C.axis : C.line) + '"/>' +
        '<text x="' + (left - 4) + '" y="' + (gy + 3) + '" text-anchor="end" class="tick">' + v.toFixed(1) + "</text>";
    });
    var yLabel = Math.max(top + 8, y - 5);
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Konvergensi proporsi empiris">' +
      ticks +
      '<line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + bottom + '" stroke="' + C.axis + '"/>' +
      '<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '" stroke="' + C.soft + '" stroke-width="1.4" stroke-dasharray="5 4"/>' +
      '<text x="' + (right - 2) + '" y="' + yLabel + '" text-anchor="end" class="tick">p = ' + f(p, 3) + "</text>" +
      body +
      '<text x="' + left + '" y="' + (bottom + 14) + '" class="tick">1</text>' +
      '<text x="' + right + '" y="' + (bottom + 14) + '" text-anchor="end" class="tick">' + (n || 0) + "</text>" +
      "</svg>";
  }

  /* tiga batang p teoretis untuk misi 4 */
  function aturanBars(hasil) {
    var W = 320, H = 116, base = 92, top = 20, scale = 62;
    var out = "";
    hasil.forEach(function (h, i) {
      var x = 46 + i * 92;
      var hh = h.p * scale;
      out += '<rect x="' + x + '" y="' + (base - hh) + '" width="46" height="' + Math.max(hh, 1) + '" rx="5" fill="' + (i === 0 ? C.accent : C.soft) + '"/>' +
        '<text x="' + (x + 23) + '" y="' + (base - hh - 5) + '" text-anchor="middle" class="val">' + f(h.p, 3) + "</text>" +
        '<text x="' + (x + 23) + '" y="' + (base + 22) + '" text-anchor="middle" class="tick">' + h.label + "</text>";
    });
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Peluang untuk tiga aturan sukses">' +
      '<line x1="26" y1="' + base + '" x2="' + (W - 8) + '" y2="' + base + '" stroke="' + C.axis + '"/>' +
      '<line x1="26" y1="' + top + '" x2="26" y2="' + base + '" stroke="' + C.axis + '"/>' +
      out + "</svg>";
  }

  root.Charts = { pmf: pmf, konvergensi: konvergensi, aturanBars: aturanBars };
})(typeof globalThis !== "undefined" ? globalThis : this);
