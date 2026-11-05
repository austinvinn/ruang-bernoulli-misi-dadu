/* GET /api/rekap — semua jawaban (hanya pengembang / kode baca).
   ?format=csv | json   ?bentuk=lebar | panjang   ?kelas=9A   ?token=<kode baca> */
import { json, galat, bacaSesi, hashKode, csv } from "./_util.js";

function urutButir(a, b) {
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
  return (parseInt(a.slice(1), 10) || 0) - (parseInt(b.slice(1), 10) || 0);
}

async function izin(request, env, url) {
  const sesi = await bacaSesi(request, env);
  if (sesi && (sesi.p === "dev" || sesi.p === "baca")) return { peran: sesi.p };

  const tok = url.searchParams.get("token");
  if (tok) {
    const row = await env.DB.prepare(
      "SELECT peran, aktif, kedaluwarsa FROM kode WHERE kode_hash = ?"
    ).bind(await hashKode(tok)).first();
    const kd = row && row.kedaluwarsa ? Date.parse(row.kedaluwarsa) : null;
    if (row && row.aktif && (row.peran === "dev" || row.peran === "baca") && (!kd || kd > Date.now())) {
      return { peran: row.peran, lewatToken: true };
    }
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const hak = await izin(request, env, url);
  if (!hak) return galat("Halaman rekap hanya untuk pengembang.", 403);

  const kelas = (url.searchParams.get("kelas") || "").trim();
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  const bentuk = (url.searchParams.get("bentuk") || "lebar").toLowerCase();

  const sqlPeserta =
    "SELECT id, kelas, nama, nim, dibuat FROM peserta" +
    (kelas ? " WHERE kelas = ?" : "") +
    " ORDER BY kelas, nama, dibuat";
  const peserta = kelas
    ? await env.DB.prepare(sqlPeserta).bind(kelas).all()
    : await env.DB.prepare(sqlPeserta).all();

  const sqlJawaban =
    "SELECT j.peserta_id, j.bagian, j.butir, j.ronde, j.nilai, j.diubah FROM jawaban j " +
    (kelas ? "JOIN peserta p ON p.id = j.peserta_id WHERE p.kelas = ? " : "") +
    "ORDER BY j.butir";
  const jawaban = kelas
    ? await env.DB.prepare(sqlJawaban).bind(kelas).all()
    : await env.DB.prepare(sqlJawaban).all();

  const baris = (peserta.results || []).map((p) => ({
    id: p.id, kelas: p.kelas, nama: p.nama, nim: p.nim, dibuat: p.dibuat,
    jawaban: {}, rondeButir: {}, ronde: 0, riwayat: [], diubah: ""
  }));
  const peta = {};
  baris.forEach((b) => { peta[b.id] = b; });

  const kumpulanButir = {};
  (jawaban.results || []).forEach((r) => {
    const b = peta[r.peserta_id];
    kumpulanButir[r.butir] = 1;
    if (!b) return;
    let v = r.nilai;
    try { v = JSON.parse(r.nilai); } catch (e) { /* teks apa adanya */ }
    const ronde = Number(r.ronde) >= 1 ? Number(r.ronde) : 1;

    /* nilai sel = jawaban dari ronde terbaru (dalam ronde yang sama, yang terakhir diubah) */
    const rondeLama = b.rondeButir[r.butir] || 0;
    if (ronde > rondeLama || (ronde === rondeLama && (!b.diubah || r.diubah >= b.diubah))) {
      b.jawaban[r.butir] = v;
      b.rondeButir[r.butir] = ronde;
    }
    if (ronde > b.ronde) b.ronde = ronde;
    b.riwayat.push({ ronde: ronde, butir: r.butir, nilai: v, diubah: r.diubah });
    if (!b.diubah || r.diubah > b.diubah) b.diubah = r.diubah;
  });
  baris.forEach((b) => {
    b.riwayat.sort((x, y) => (x.ronde - y.ronde) || urutButir(x.butir, y.butir));
  });
  const butir = Object.keys(kumpulanButir).sort(urutButir);

  /* hasil percobaan: satu lemparan per bagian per ronde */
  let lemparan = { results: [] };
  try {
    const sqlLemparan =
      "SELECT l.peserta_id, l.bagian, l.ronde, l.deret, l.aturan, l.x FROM lemparan l " +
      (kelas ? "JOIN peserta p ON p.id = l.peserta_id WHERE p.kelas = ? " : "") +
      "ORDER BY l.bagian";
    lemparan = kelas
      ? await env.DB.prepare(sqlLemparan).bind(kelas).all()
      : await env.DB.prepare(sqlLemparan).all();
  } catch (e) {
    /* D1 lama belum punya kolom ronde/aturan/x */
    const sqlLama =
      "SELECT l.peserta_id, l.bagian, l.deret FROM lemparan l " +
      (kelas ? "JOIN peserta p ON p.id = l.peserta_id WHERE p.kelas = ? " : "") +
      "ORDER BY l.bagian";
    lemparan = kelas
      ? await env.DB.prepare(sqlLama).bind(kelas).all()
      : await env.DB.prepare(sqlLama).all();
  }

  const bagianAda = {};
  (lemparan.results || []).forEach((r) => {
    const b = peta[r.peserta_id];
    if (!b) return;
    let deret = [];
    try { deret = JSON.parse(r.deret); } catch (e) { deret = []; }
    const ronde = Number(r.ronde) >= 1 ? Number(r.ronde) : 1;
    const isi = {
      ronde: ronde,
      deret: deret,
      aturan: r.aturan || "",
      x: r.x === 0 || r.x === 1 ? r.x : null
    };
    b.lemparan = b.lemparan || {};
    const lama = b.lemparan[r.bagian];
    if (!lama || ronde >= (lama.ronde || 1)) b.lemparan[r.bagian] = isi;
    b.lemparanRiwayat = b.lemparanRiwayat || [];
    b.lemparanRiwayat.push(Object.assign({ bagian: r.bagian }, isi));
    bagianAda[r.bagian] = 1;
  });
  const bagian = Object.keys(bagianAda).sort();

  if (format === "csv") {
    let isi = "";
    if (bentuk === "panjang") {
      const kepala = ["kelas", "nama", "nim", "peserta", "ronde", "bagian", "butir", "nilai", "diubah"];
      const rows = [kepala];
      (jawaban.results || []).forEach((r) => {
        const b = peta[r.peserta_id] || {};
        let v = r.nilai;
        try { v = JSON.parse(r.nilai); } catch (e) { /* teks */ }
        rows.push([b.kelas || "", b.nama || "", b.nim || "", r.peserta_id,
          Number(r.ronde) >= 1 ? Number(r.ronde) : 1, r.bagian, r.butir,
          typeof v === "string" ? v : JSON.stringify(v), r.diubah]);
      });
      isi = csv(rows);
    } else {
      const kepala = ["kelas", "nama", "nim", "peserta", "dibuat", "ronde"].concat(butir)
        .concat(bagian.map((g) => "aturan_" + g))
        .concat(bagian.map((g) => "hasil_" + g))
        .concat(["ronde_tiap_butir", "terakhir_diubah", "jumlah_butir"]);
      const rows = [kepala];
      baris.forEach((b) => {
        const sel = [b.kelas, b.nama, b.nim, b.id, b.dibuat, b.ronde || ""];
        butir.forEach((id) => {
          const v = b.jawaban[id];
          sel.push(v === undefined ? "" : (typeof v === "string" ? v : JSON.stringify(v)));
        });
        bagian.forEach((g) => {
          const p = b.lemparan && b.lemparan[g];
          sel.push(p ? p.aturan || "" : "");
        });
        bagian.forEach((g) => {
          const p = b.lemparan && b.lemparan[g];
          sel.push(p ? p.deret.join("+") + (p.x === null ? "" : " · " + (p.x ? "S" : "G")) : "");
        });
        sel.push(Object.keys(b.rondeButir || {}).sort(urutButir)
          .map((id) => id + ":" + b.rondeButir[id]).join(" "));
        sel.push(b.diubah || "");
        sel.push(Object.keys(b.jawaban).length);
        rows.push(sel);
      });
      isi = csv(rows);
    }
    const nama = "rekap-misi-dadu" + (kelas ? "-" + kelas : "") + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    /* bom=0 dipakai formula IMPORTDATA di Google Sheets (BOM membuat nama kolom kotor) */
    const tanpaBom = url.searchParams.get("bom") === "0";
    const kepala = {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store"
    };
    /* mode umpan (IMPORTDATA) tanpa header attachment: Google menolak unduhan bertanda attachment */
    if (!tanpaBom) kepala["content-disposition"] = 'attachment; filename="' + nama + '"';
    return new Response((tanpaBom ? "" : "\ufeff") + isi, { status: 200, headers: kepala });
  }

  return json({
    ok: true,
    peran: hak.peran,
    kelas: kelas || null,
    butir: butir,
    bagian: bagian,
    jumlah: baris.length,
    baris: baris
  });
}
