/* DELETE /api/peserta — siswa menghapus datanya sendiri (benar-benar dihapus di D1).
   POST   /api/peserta {mode:"kosongkan"} — hapus jawaban + lemparan, peserta tetap
          (dipakai tombol "Hapus progres" supaya jawaban lama tidak muncul lagi). */
import { json, galat, bacaSesi, hapusCookie, NAMA_COOKIE } from "./_util.js";

function jumlahHapus(r) {
  return (r && r.meta && r.meta.changes) || 0;
}

export async function onRequestPost({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk.", 401);

  let body = {};
  try { body = await request.json(); } catch (e) { body = {}; }
  if (!body || body.mode !== "kosongkan") return galat("Mode tidak dikenali.", 400);

  const pid = sesi.id;
  const j = await env.DB.prepare("DELETE FROM jawaban WHERE peserta_id = ?").bind(pid).run();
  const l = await env.DB.prepare("DELETE FROM lemparan WHERE peserta_id = ?").bind(pid).run();

  return json({
    ok: true,
    dikosongkan: { jawaban: jumlahHapus(j), lemparan: jumlahHapus(l) }
  });
}

export async function onRequestDelete({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk.", 401);

  const pid = sesi.id;
  const j = await env.DB.prepare("DELETE FROM jawaban WHERE peserta_id = ?").bind(pid).run();
  const l = await env.DB.prepare("DELETE FROM lemparan WHERE peserta_id = ?").bind(pid).run();
  const p = await env.DB.prepare("DELETE FROM peserta WHERE id = ?").bind(pid).run();

  const jumlah = {
    jawaban: jumlahHapus(j),
    lemparan: jumlahHapus(l),
    peserta: jumlahHapus(p)
  };

  return json(
    { ok: true, deleted: jumlah.peserta > 0 || jumlah.jawaban > 0, jumlah: jumlah },
    200,
    { "set-cookie": hapusCookie(request, NAMA_COOKIE) }
  );
}
