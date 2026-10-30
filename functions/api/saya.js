/* GET /api/saya — siapa yang sedang masuk + jawaban tersimpan di server. */
import { json, galat, bacaSesi } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk.", 401);

  const p = await env.DB.prepare(
    "SELECT id, kelas, nama, nim, dibuat FROM peserta WHERE id = ?"
  ).bind(sesi.id).first();

  const j = await env.DB.prepare(
    "SELECT bagian, butir, nilai, diubah FROM jawaban WHERE peserta_id = ? ORDER BY butir"
  ).bind(sesi.id).all();

  const jawaban = {};
  (j.results || []).forEach((r) => {
    let v = r.nilai;
    try { v = JSON.parse(r.nilai); } catch (e) { /* biarkan teks */ }
    jawaban[r.butir] = { v: v, ts: r.diubah };
  });

  return json({
    ok: true,
    peran: sesi.p,
    kelas: sesi.k,
    peserta: p || { id: sesi.id, kelas: sesi.k, nama: "", nim: "" },
    jawaban: jawaban
  });
}
