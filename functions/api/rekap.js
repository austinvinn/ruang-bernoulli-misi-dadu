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
    "SELECT j.peserta_id, j.bagian, j.butir, j.nilai, j.diubah FROM jawaban j " +
    (kelas ? "JOIN peserta p ON p.id = j.peserta_id WHERE p.kelas = ? " : "") +
    "ORDER BY j.butir";
  const jawaban = kelas
    ? await env.DB.prepare(sqlJawaban).bind(kelas).all()
    : await env.DB.prepare(sqlJawaban).all();

  const baris = (peserta.results || []).map((p) => ({
    id: p.id, kelas: p.kelas, nama: p.nama, nim: p.nim, dibuat: p.dibuat, jawaban: {}, diubah: ""
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
    b.jawaban[r.butir] = v;
    if (!b.diubah || r.diubah > b.diubah) b.diubah = r.diubah;
  });
  const butir = Object.keys(kumpulanButir).sort(urutButir);

  if (format === "csv") {
    let isi = "";
    if (bentuk === "panjang") {
      const kepala = ["kelas", "nama", "nim", "peserta", "bagian", "butir", "nilai", "diubah"];
      const rows = [kepala];
      (jawaban.results || []).forEach((r) => {
        const b = peta[r.peserta_id] || {};
        let v = r.nilai;
        try { v = JSON.parse(r.nilai); } catch (e) { /* teks */ }
        rows.push([b.kelas || "", b.nama || "", b.nim || "", r.peserta_id, r.bagian, r.butir,
          typeof v === "string" ? v : JSON.stringify(v), r.diubah]);
      });
      isi = csv(rows);
    } else {
      const kepala = ["kelas", "nama", "nim", "peserta", "dibuat"].concat(butir).concat(["terakhir_diubah", "jumlah_butir"]);
      const rows = [kepala];
      baris.forEach((b) => {
        const sel = [b.kelas, b.nama, b.nim, b.id, b.dibuat];
        butir.forEach((id) => {
          const v = b.jawaban[id];
          sel.push(v === undefined ? "" : (typeof v === "string" ? v : JSON.stringify(v)));
        });
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
    jumlah: baris.length,
    baris: baris
  });
}
