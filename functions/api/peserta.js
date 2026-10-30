/* DELETE /api/peserta — siswa menghapus datanya sendiri (benar-benar dihapus di D1). */
import { json, galat, bacaSesi, hapusCookie, NAMA_COOKIE } from "./_util.js";

export async function onRequestDelete({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk.", 401);

  const pid = sesi.id;
  const j = await env.DB.prepare("DELETE FROM jawaban WHERE peserta_id = ?").bind(pid).run();
  const l = await env.DB.prepare("DELETE FROM lemparan WHERE peserta_id = ?").bind(pid).run();
  const p = await env.DB.prepare("DELETE FROM peserta WHERE id = ?").bind(pid).run();

  const jumlah = {
    jawaban: (j.meta && j.meta.changes) || 0,
    lemparan: (l.meta && l.meta.changes) || 0,
    peserta: (p.meta && p.meta.changes) || 0
  };

  return json(
    { ok: true, deleted: jumlah.peserta > 0 || jumlah.jawaban > 0, jumlah: jumlah },
    200,
    { "set-cookie": hapusCookie(request, NAMA_COOKIE) }
  );
}
