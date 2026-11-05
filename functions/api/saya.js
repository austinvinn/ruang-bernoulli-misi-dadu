/* GET /api/saya — siapa yang sedang masuk + jawaban tersimpan di server. */
import { json, galat, bacaSesi } from "./_util.js";

/* D1 kadang memberi "YYYY-MM-DD HH:MM:SS" (UTC). Klien membandingkan waktu sebagai
   string ISO, jadi samakan bentuknya supaya perbandingan tidak salah. */
function iso(t) {
  const s = String(t || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s.replace(" ", "T") + "Z";
  return s;
}

export async function onRequestGet({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk.", 401);

  const p = await env.DB.prepare(
    "SELECT id, kelas, nama, nim, dibuat FROM peserta WHERE id = ?"
  ).bind(sesi.id).first();

  const j = await env.DB.prepare(
    "SELECT bagian, butir, nilai, diubah FROM jawaban WHERE peserta_id = ? " +
    "AND ronde = (SELECT MAX(ronde) FROM jawaban WHERE peserta_id = ?) ORDER BY butir"
  ).bind(sesi.id, sesi.id).all();

  const jawaban = {};
  (j.results || []).forEach((r) => {
    let v = r.nilai;
    try { v = JSON.parse(r.nilai); } catch (e) { /* biarkan teks */ }
    jawaban[r.butir] = { v: v, ts: iso(r.diubah) };
  });

  let ronde = 1;
  try {
    const r = await env.DB.prepare(
      "SELECT MAX(ronde) AS r FROM jawaban WHERE peserta_id = ?"
    ).bind(sesi.id).first();
    if (r && r.r >= 1) ronde = r.r;
  } catch (e) { /* tabel lama tanpa kolom ronde */ }

  return json({
    ok: true,
    peran: sesi.p,
    kelas: sesi.k,
    ronde: ronde,
    peserta: p ? Object.assign({}, p, { dibuat: iso(p.dibuat) }) : { id: sesi.id, kelas: sesi.k, nama: "", nim: "" },
    jawaban: jawaban
  });
}
