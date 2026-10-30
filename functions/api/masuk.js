/* POST /api/masuk — tukar kode akses jadi sesi (cookie HttpOnly). */
import {
  json, galat, hashKode, ttd, setCookie, NAMA_COOKIE,
  bacaSesi, ipDari, batasPercobaan, catatGagal
} from "./_util.js";

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return galat("Permintaan tidak valid.", 400); }

  const kode = String(body.kode || "").trim();
  if (kode.length < 4) return galat("Tulis kode akses dulu.", 400);

  const ip = ipDari(request);
  const cek = await batasPercobaan(env, ip);
  if (cek.terlalu) return galat("Terlalu banyak percobaan kode. Tunggu 10 menit lalu coba lagi.", 429);

  const h = await hashKode(kode);
  const row = await env.DB.prepare(
    "SELECT kode_hash, label, kelas, peran, aktif, kedaluwarsa FROM kode WHERE kode_hash = ?"
  ).bind(h).first();

  const kini = Date.now();
  const kedaluwarsa = row && row.kedaluwarsa ? Date.parse(row.kedaluwarsa) : null;
  if (!row || !row.aktif || (kedaluwarsa && kedaluwarsa < kini)) {
    await catatGagal(env, ip);
    return galat("Kode tidak dikenali atau sudah tidak berlaku.", 401);
  }

  const lama = await bacaSesi(request, env);
  const pid = lama && lama.id ? lama.id : crypto.randomUUID();
  const nama = String(body.nama || "").slice(0, 80).trim();
  const nim = String(body.nim || "").slice(0, 30).trim();
  const sekarang = new Date().toISOString();

  /* peserta hanya untuk siswa; kode dev/baca tidak membuat baris peserta */
  if (row.peran === "siswa") {
    await env.DB.prepare(
    "INSERT INTO peserta(id, kelas, nama, nim, dibuat, kode_hash) VALUES(?,?,?,?,?,?) " +
    "ON CONFLICT(id) DO UPDATE SET kelas = excluded.kelas, kode_hash = excluded.kode_hash, " +
    "nama = CASE WHEN excluded.nama <> '' THEN excluded.nama ELSE peserta.nama END, " +
    "nim = CASE WHEN excluded.nim <> '' THEN excluded.nim ELSE peserta.nim END"
    ).bind(pid, row.kelas, nama, nim, sekarang, row.kode_hash).run();
  }

  /* kode benar: bersihkan hitungan gagal untuk IP ini supaya satu kelas
     yang berbagi IP tidak ikut terkunci gara-gara salah ketik orang lain */
  try { await env.DB.prepare("DELETE FROM coba WHERE ip = ?").bind(ip).run(); } catch (e) { /* abaikan */ }

  const sesi = { p: row.peran, k: row.kelas, id: pid, exp: kini + 30 * 86400000 };
  const tok = await ttd(sesi, env.SESI_SECRET);

  return json(
    { ok: true, peran: row.peran, kelas: row.kelas, label: row.label || "", id: pid },
    200,
    { "set-cookie": setCookie(request, NAMA_COOKIE, tok, 30 * 86400) }
  );
}
