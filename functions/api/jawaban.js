/* POST /api/jawaban — simpan jawaban butir + deret lemparan (idempoten).
   GET  /api/jawaban — ambil jawaban milik sendiri. */
import { json, galat, bacaSesi } from "./_util.js";

const POLA_BUTIR = /^[A-E][0-9]{1,2}$/;

export async function onRequestGet({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk.", 401);
  const j = await env.DB.prepare(
    "SELECT bagian, butir, nilai, diubah FROM jawaban WHERE peserta_id = ? ORDER BY butir"
  ).bind(sesi.id).all();
  return json({ ok: true, jawaban: j.results || [] });
}

export async function onRequestPost({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi) return galat("Belum masuk atau kode akses sudah kedaluwarsa.", 401);

  const mentah = await request.text();
  if (mentah.length > 64 * 1024) return galat("Kiriman terlalu besar.", 413);
  let body;
  try { body = JSON.parse(mentah); } catch (e) { return galat("Permintaan tidak valid.", 400); }

  const sekarang = new Date().toISOString();
  const pid = sesi.id;

  const nama = String(body.nama || "").slice(0, 80).trim();
  const nim = String(body.nim || "").slice(0, 30).trim();
  if (nama || nim) {
    await env.DB.prepare(
      "UPDATE peserta SET nama = CASE WHEN ? <> '' THEN ? ELSE nama END, " +
      "nim = CASE WHEN ? <> '' THEN ? ELSE nim END WHERE id = ?"
    ).bind(nama, nama, nim, nim, pid).run();
  }

  const butir = Array.isArray(body.butir) ? body.butir.slice(0, 40) : [];
  const perintah = [];
  let tersimpan = 0;

  for (const b of butir) {
    const id = String(b && b.id || "").toUpperCase();
    if (!POLA_BUTIR.test(id)) continue;
    let nilai = b.nilai;
    if (nilai === null || nilai === undefined) continue;
    const teks = typeof nilai === "string" ? nilai : JSON.stringify(nilai);
    if (teks.length > 8000) continue;
    perintah.push(env.DB.prepare(
      "INSERT INTO jawaban(peserta_id, bagian, butir, nilai, diubah) VALUES(?,?,?,?,?) " +
      "ON CONFLICT(peserta_id, bagian, butir) DO UPDATE SET nilai = excluded.nilai, diubah = excluded.diubah"
    ).bind(pid, id[0], id, teks, sekarang));
    tersimpan++;
  }

  if (perintah.length) await env.DB.batch(perintah);

  /* Satu percobaan = satu lemparan: deret berisi 1–2 angka. Deret kosong
     (mis. siswa hanya mengubah butir) tidak boleh menimpa hasil yang ada. */
  const l = body.lemparan;
  if (l && typeof l.bagian === "string" && Array.isArray(l.deret) && /^[A-E]$/.test(l.bagian)) {
    const deret = l.deret.slice(0, 600).map((x) => Number(x)).filter((x) => x >= 1 && x <= 6);
    if (deret.length) {
      const aturan = String(l.aturan || "").slice(0, 120);
      const x = l.x === 0 || l.x === 1 ? l.x : null;
      const isi = JSON.stringify(deret);
      try {
        await env.DB.prepare(
          "INSERT INTO lemparan(peserta_id, bagian, deret, aturan, x, diubah) VALUES(?,?,?,?,?,?) " +
          "ON CONFLICT(peserta_id, bagian) DO UPDATE SET deret = excluded.deret, " +
          "aturan = excluded.aturan, x = excluded.x, diubah = excluded.diubah"
        ).bind(pid, l.bagian, isi, aturan, x, sekarang).run();
      } catch (e) {
        /* D1 lama belum punya kolom aturan/x: simpan deret saja */
        await env.DB.prepare(
          "INSERT INTO lemparan(peserta_id, bagian, deret, diubah) VALUES(?,?,?,?) " +
          "ON CONFLICT(peserta_id, bagian) DO UPDATE SET deret = excluded.deret, diubah = excluded.diubah"
        ).bind(pid, l.bagian, isi, sekarang).run();
      }
    }
  }

  return json({ ok: true, tersimpan: tersimpan, waktu: sekarang });
}
