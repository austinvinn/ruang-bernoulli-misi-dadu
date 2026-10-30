/* =========================================================
   lkm.js — mesin lembar kerja: render butir, simpan jawaban,
   buka materi setelah semua butir terjawab, dan render KaTeX.
   Bergantung pada: store.js (Store), lkm-data.js (LKM_DATA),
   vendor/katex/katex.min.js (opsional; ada fallback teks).
   ========================================================= */
(function (root) {
  "use strict";

  var DATA = root.LKM_DATA || [];
  var S = root.Store;

  /* ---------------- util ---------------- */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* teks ringan: **tebal**, *miring*, $rumus$ dan $$rumus blok$$ */
  function teksRingan(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:]|$)/g, "$1<i>$2</i>");
  }

  function md(str) {
    if (str === null || str === undefined) return "";
    var out = "", last = 0, m;
    var re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
    while ((m = re.exec(String(str)))) {
      out += teksRingan(String(str).slice(last, m.index));
      var tok = m[0];
      var blok = tok.slice(0, 2) === "$$";
      var tex = blok ? tok.slice(2, -2) : tok.slice(1, -1);
      out += '<span class="kx' + (blok ? " kx-blk" : "") + '" data-tex="' + esc(tex) + '"' +
        (blok ? ' data-display="1"' : "") + "></span>";
      last = m.index + tok.length;
    }
    out += teksRingan(String(str).slice(last));
    return out;
  }

  /* render semua $...$ yang sudah masuk DOM */
  function renderMath(wadah) {
    if (!wadah) return;
    var nodes = wadah.querySelectorAll("[data-tex]");
    var kx = root.katex;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute("data-rendered") === "1") continue;
      var tex = el.getAttribute("data-tex");
      var blok = el.getAttribute("data-display") === "1";
      if (kx && typeof kx.render === "function") {
        try {
          kx.render(tex, el, { displayMode: blok, throwOnError: false, strict: false, output: "html" });
        } catch (e) {
          el.textContent = tex;
        }
      } else {
        el.textContent = tex;
      }
      el.setAttribute("data-rendered", "1");
    }
  }

  /* ---------------- data ---------------- */
  function bagian(kode) {
    for (var i = 0; i < DATA.length; i++) if (DATA[i].kode === kode) return DATA[i];
    return null;
  }
  function forMisi(misiId) {
    for (var i = 0; i < DATA.length; i++) if (DATA[i].misi === misiId) return DATA[i];
    return null;
  }
  function butirById(id) {
    for (var i = 0; i < DATA.length; i++) {
      for (var j = 0; j < DATA[i].butir.length; j++) {
        if (DATA[i].butir[j].id === id) return DATA[i].butir[j];
      }
    }
    return null;
  }

  /* sel tabel yang harus diisi siswa */
  function selKosong(bt) {
    var isi = [];
    for (var r = 0; r < bt.baris.length; r++) {
      var tetap = bt.baris[r].length;
      for (var c = tetap; c < bt.kolom.length; c++) isi.push(r + "-" + c);
    }
    return isi;
  }

  function butirTerisi(id, v) {
    var bt = butirById(id);
    if (!bt) return v !== null && v !== undefined && String(v).trim() !== "";
    if (v === null || v === undefined) return false;
    if (bt.tipe === "tabel") {
      var sel = selKosong(bt);
      if (!sel.length) return false;
      for (var i = 0; i < sel.length; i++) {
        var isi = v[sel[i]];
        if (isi === undefined || String(isi).trim() === "") return false;
      }
      return true;
    }
    return String(v).trim() !== "";
  }

  function jumlahTerisi(kode, state) {
    var b = bagian(kode);
    if (!b) return { terisi: 0, total: 0 };
    var t = 0;
    b.butir.forEach(function (bt) {
      if (butirTerisi(bt.id, S.jawabNilai(state, bt.id))) t++;
    });
    return { terisi: t, total: b.butir.length };
  }

  function jawabanLengkap(kode, state) {
    var j = jumlahTerisi(kode, state);
    return j.total > 0 && j.terisi === j.total;
  }

  function jawabanLengkapMisi(state, misiId) {
    var b = forMisi(misiId);
    if (!b) return true;          /* tidak ada LKM untuk misi ini */
    return jawabanLengkap(b.kode, state);
  }

  /* deret angka dadu mentah untuk membantu pengisian tabel */
  function deret(misiId, state) {
    if (!S) return [];
    var r = S.rek(state, misiId);
    if (misiId === 4) return (r.rules && r.rules[1]) || [];
    return r.rolls || [];
  }

  /* ---------------- render butir ---------------- */
  function statusButir(bt, state) {
    var ok = butirTerisi(bt.id, S.jawabNilai(state, bt.id));
    return ok
      ? '<span class="b-status ok">✓ tersimpan</span>'
      : '<span class="b-status">belum diisi</span>';
  }

  function inputTeks(bt, nilai) {
    return '<textarea class="ta" data-jawab="' + bt.id + '" rows="2" aria-label="Jawaban ' + bt.id +
      '" placeholder="Tulis jawabanmu di sini…">' + esc(nilai || "") + "</textarea>";
  }

  function inputAngka(bt, nilai) {
    return '<div class="angka-row"><input class="inp angka" data-jawab="' + bt.id +
      '" inputmode="decimal" autocomplete="off" aria-label="Jawaban ' + bt.id +
      '" placeholder="angka" value="' + esc(nilai || "") + '"></div>';
  }

  function inputTabel(bt, nilai) {
    var v = nilai && typeof nilai === "object" ? nilai : {};
    var head = "", body = "";
    bt.kolom.forEach(function (k) { head += "<th>" + md(k) + "</th>"; });
    for (var r = 0; r < bt.baris.length; r++) {
      var tr = "<tr>";
      for (var c = 0; c < bt.kolom.length; c++) {
        if (c < bt.baris[r].length) {
          tr += '<td class="t-fix">' + md(bt.baris[r][c]) + "</td>";
        } else {
          var key = r + "-" + c;
          tr += '<td><input class="inp sel" data-jawab="' + bt.id + '" data-r="' + r + '" data-c="' + c +
            '" inputmode="decimal" autocomplete="off" aria-label="' + bt.id + " baris " + (r + 1) + " kolom " +
            bt.kolom[c].replace(/<[^>]+>/g, "") + '" value="' + esc(v[key] || "") + '"></td>';
        }
      }
      body += tr + "</tr>";
    }
    return '<div class="tabel-wrap"><table class="t-lkm"><thead><tr>' + head +
      "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function inputPilihan(bt, nilai) {
    var out = '<div class="opsi">';
    bt.opsi.forEach(function (o) {
      var on = String(nilai || "") === o;
      out += '<button class="opsi-btn' + (on ? " on" : "") + '" data-jawab="' + bt.id +
        '" data-pilih="' + esc(o) + '" aria-pressed="' + on + '">' + esc(o) + "</button>";
    });
    return out + "</div>";
  }

  function renderButir(bt, state, nomor) {
    var nilai = S.jawabNilai(state, bt.id);
    var input =
      bt.tipe === "tabel" ? inputTabel(bt, nilai) :
      bt.tipe === "angka" ? inputAngka(bt, nilai) :
      bt.tipe === "pilihan" ? inputPilihan(bt, nilai) :
      inputTeks(bt, nilai);

    return '<li class="butir" data-butir="' + bt.id + '">' +
      '<div class="b-head">' +
      '<span class="b-num">' + nomor + "</span>" +
      '<div class="b-soal">' + md(bt.soal) + "</div>" +
      "</div>" +
      '<div class="b-input">' + input + "</div>" +
      (bt.petunjuk ? '<p class="b-tip">' + md(bt.petunjuk) + "</p>" : "") +
      '<div class="b-foot">' + statusButir(bt, state) + "</div>" +
      "</li>";
  }

  /* ---------------- panel lembar kerja ---------------- */
  /* butir dengan fase "pra" dirender sebelum percobaan (prediksi),
     sisanya dirender setelah percobaan */
  function renderPra(kode, state) {
    var b = bagian(kode);
    if (!b) return "";
    var pra = b.butir.filter(function (bt) { return bt.fase === "pra"; });
    if (!pra.length) return "";
    var li = pra.map(function (bt) { return renderButir(bt, state, bt.id); }).join("");
    return '<section class="lkm pra" id="lkm-pra">' +
      '<div class="lkm-head">' +
      '<div><div class="eyebrow">Bagian ' + b.kode + " · sebelum percobaan</div>" +
      "<h3>Prediksi dulu, baru melempar</h3></div></div>" +
      '<ol class="butir-list">' + li + "</ol>" +
      "</section>";
  }

  function renderPanel(kode, state) {
    var b = bagian(kode);
    if (!b) return "";
    var j = jumlahTerisi(kode, state);
    var daftar = b.butir.filter(function (bt) { return bt.fase !== "pra"; });
    var li = daftar.map(function (bt) { return renderButir(bt, state, bt.id); }).join("");
    var lengkap = j.terisi === j.total;

    return '<section class="lkm" id="lkm-panel">' +
      '<div class="lkm-head">' +
      '<div><div class="eyebrow">Lembar kerja · Bagian ' + b.kode + "</div>" +
      "<h3>" + esc(b.judul) + "</h3></div>" +
      '<span class="chip" id="lkm-chip">' + j.terisi + " / " + j.total + " butir</span>" +
      "</div>" +
      '<p class="lkm-tujuan">' + md(b.tujuan) + "</p>" +
      '<p class="lkm-atur">Jawabanmu tersimpan otomatis di perangkat ini. Materi Bagian ' + b.kode +
      " terbuka setelah semua butir terjawab.</p>" +
      '<ol class="butir-list">' + li + "</ol>" +
      (lengkap
        ? '<div class="toast lkm-done">✓ <div><b>Semua butir Bagian ' + b.kode + " sudah terjawab.</b> Materi terbuka di bawah.</div></div>"
        : '<p class="note lkm-sisa" id="lkm-sisa">Sisa ' + (j.total - j.terisi) + " butir lagi untuk membuka materi.</p>") +
      "</section>" +
      renderMateri(kode, state);
  }

  function renderMateri(kode, state) {
    var b = bagian(kode);
    if (!b || !b.materi) return "";
    var lengkap = jawabanLengkap(kode, state);
    if (!lengkap) {
      var j = jumlahTerisi(kode, state);
      return '<section class="materi locked" id="materi">' +
        '<div class="materi-head"><span class="m-ico" aria-hidden="true">🔒</span>' +
        '<div><div class="eyebrow">Materi Bagian ' + kode + " · terkunci</div>" +
        "<h3>Terbuka setelah " + j.total + " butir terjawab</h3></div></div>" +
        '<p class="note">Kerjakan lembar kerja di atas lebih dulu. Materi ditaruh di akhir supaya kamu menemukan bentuknya sendiri sebelum diberi nama.</p>' +
        "</section>";
    }
    var par = b.materi.isi.map(function (p) {
      return '<p class="m-p">' + md(p) + "</p>";
    }).join("");
    return '<section class="materi" id="materi">' +
      '<div class="materi-head"><span class="m-ico" aria-hidden="true">📘</span>' +
      '<div><div class="eyebrow">Materi Bagian ' + kode + "</div>" +
      "<h3>" + esc(b.materi.judul) + "</h3></div></div>" +
      par +
      "</section>";
  }

  /* ---------------- perbarui tanpa render ulang ---------------- */
  function refresh(kode, state) {
    var b = bagian(kode);
    if (!b) return;
    var j = jumlahTerisi(kode, state);

    var chip = document.getElementById("lkm-chip");
    if (chip) chip.textContent = j.terisi + " / " + j.total + " butir";

    b.butir.forEach(function (bt) {
      var li = document.querySelector('[data-butir="' + bt.id + '"]');
      if (!li) return;
      var foot = li.querySelector(".b-foot");
      if (foot) foot.innerHTML = statusButir(bt, state);
    });

    var sisa = document.getElementById("lkm-sisa");
    if (sisa) sisa.textContent = "Sisa " + (j.total - j.terisi) + " butir lagi untuk membuka materi.";

    var lama = document.getElementById("materi");
    var lengkap = j.terisi === j.total;
    var butuhGanti = !lama || (lengkap && lama.classList.contains("locked")) ||
      (!lengkap && !lama.classList.contains("locked"));
    if (butuhGanti && lama && lama.parentNode) {
      var wadah = document.createElement("div");
      wadah.innerHTML = renderMateri(kode, state);
      var baru = wadah.firstChild;
      lama.parentNode.replaceChild(baru, lama);
      renderMath(baru);
    }
    var done = document.querySelector(".lkm-done");
    if (lengkap && !done) {
      var panel = document.getElementById("lkm-panel");
      var s = document.getElementById("lkm-sisa");
      if (panel && s && s.parentNode === panel) {
        var t = document.createElement("div");
        t.className = "toast lkm-done";
        t.innerHTML = "✓ <div><b>Semua butir Bagian " + kode + " sudah terjawab.</b> Materi terbuka di bawah.</div>";
        panel.replaceChild(t, s);
      }
    }
  }

  /* ---------------- simpan dari elemen ---------------- */
  function simpanInput(el, state) {
    var id = el.getAttribute("data-jawab");
    var bt = butirById(id);
    if (!bt) return null;

    if (bt.tipe === "tabel") {
      var lama = S.jawabNilai(state, id);
      var obj = {};
      if (lama && typeof lama === "object") {
        for (var k in lama) if (Object.prototype.hasOwnProperty.call(lama, k)) obj[k] = lama[k];
      }
      obj[el.getAttribute("data-r") + "-" + el.getAttribute("data-c")] = el.value;
      S.jawab(state, id, obj);
    } else if (bt.tipe === "pilihan") {
      S.jawab(state, id, el.getAttribute("data-pilih"));
    } else {
      S.jawab(state, id, el.value);
    }
    return bt;
  }

  root.LKM = {
    DATA: DATA,
    md: md,
    esc: esc,
    renderMath: renderMath,
    bagian: bagian,
    forMisi: forMisi,
    butirById: butirById,
    butirTerisi: butirTerisi,
    jumlahTerisi: jumlahTerisi,
    jawabanLengkap: jawabanLengkap,
    jawabanLengkapMisi: jawabanLengkapMisi,
    deret: deret,
    renderPanel: renderPanel,
    renderPra: renderPra,
    renderMateri: renderMateri,
    refresh: refresh,
    simpanInput: simpanInput
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
