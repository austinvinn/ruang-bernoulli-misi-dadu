/* GET  /api/kode — daftar kode akses (pengembang).
   POST /api/kode — {aksi:"buat", peran, kelas, label} atau {aksi:"matikan", id}. */
import { json, galat, bacaSesi, hashKode } from "./_util.js";

const AB = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function acak(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  let s = "";
  for (let i = 0; i < n; i++) s += AB[a[i] % AB.length];
  return s;
}

async function hanyaDev(request, env) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return { galat: galat("Belum masuk.", 401) };
  if (sesi.p !== "dev") return { galat: galat("Hanya pengembang.", 403) };
  return { sesi: sesi };
}

export async function onRequestGet({ request, env }) {
  const cek = await hanyaDev(request, env);
  if (cek.galat) return cek.galat;
  const r = await env.DB.prepare(
    "SELECT substr(kode_hash, 1, 10) AS id, label, kelas, peran, aktif, kedaluwarsa, dibuat " +
    "FROM kode ORDER BY peran, kelas, dibuat DESC"
  ).all();
  return json({ ok: true, kode: r.results || [] });
}

export async function onRequestPost({ request, env }) {
  const cek = await hanyaDev(request, env);
  if (cek.galat) return cek.galat;

  let body;
  try { body = await request.json(); } catch (e) { return galat("Permintaan tidak valid.", 400); }
  const aksi = String(body.aksi || "buat");

  if (aksi === "matikan") {
    const id = String(body.id || "").toLowerCase();
    if (!/^[0-9a-f]{6,16}$/.test(id)) return galat("ID kode tidak valid.", 400);
    const r = await env.DB.prepare("UPDATE kode SET aktif = 0 WHERE substr(kode_hash, 1, 10) = ?").bind(id).run();
    return json({ ok: true, diubah: (r.meta && r.meta.changes) || 0 });
  }

  if (aksi === "aktifkan") {
    const id = String(body.id || "").toLowerCase();
    if (!/^[0-9a-f]{6,16}$/.test(id)) return galat("ID kode tidak valid.", 400);
    const r = await env.DB.prepare("UPDATE kode SET aktif = 1 WHERE substr(kode_hash, 1, 10) = ?").bind(id).run();
    return json({ ok: true, diubah: (r.meta && r.meta.changes) || 0 });
  }

  if (aksi !== "buat") return galat("Aksi tidak dikenal.", 400);

  const peran = ["siswa", "dev", "baca"].indexOf(String(body.peran || "siswa")) >= 0 ? String(body.peran || "siswa") : "siswa";
  const kelas = String(body.kelas || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const label = String(body.label || "").slice(0, 60).trim();
  const kedaluwarsa = body.kedaluwarsa ? String(body.kedaluwarsa).slice(0, 30) : null;

  if (peran === "siswa" && !kelas) return galat("Kode siswa butuh nama kelas.", 400);

  const kode = peran === "siswa"
    ? "DADU-" + kelas + "-" + acak(4)
    : (peran === "dev" ? "DEV-DADU-" : "BACA-DADU-") + acak(4) + "-" + acak(4);

  const h = await hashKode(kode);
  const sekarang = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO kode(kode_hash, label, kelas, peran, aktif, kedaluwarsa, dibuat) VALUES(?,?,?,?,1,?,?)"
  ).bind(h, label, kelas, peran, kedaluwarsa, sekarang).run();

  return json({
    ok: true,
    kode: kode,
    id: h.slice(0, 10),
    peran: peran,
    kelas: kelas,
    label: label,
    catatan: "Kode ini hanya ditampilkan sekali. Salin sekarang."
  });
}
