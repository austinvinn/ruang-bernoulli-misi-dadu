/* POST /api/sheet — kirim ulang seluruh rekap ke Google Sheets (Apps Script Web App).
   Butuh secret SHEET_URL (+ opsional SHEET_TOKEN). Hanya pengembang. */
import { json, galat, bacaSesi } from "./_util.js";

export async function onRequestPost({ request, env }) {
  const sesi = await bacaSesi(request, env);
  if (!sesi || sesi.p !== "dev") return galat("Hanya pengembang.", 403);

  if (!env.SHEET_URL) {
    return galat("SHEET_URL belum diatur. Jalankan: wrangler pages secret put SHEET_URL --project-name=misi-dadu", 400);
  }

  const peserta = await env.DB.prepare(
    "SELECT id, kelas, nama, nim, dibuat FROM peserta ORDER BY kelas, nama"
  ).all();
  const jawaban = await env.DB.prepare(
    "SELECT peserta_id, bagian, butir, nilai, diubah FROM jawaban ORDER BY butir"
  ).all();

  const baris = (peserta.results || []).map((p) => ({
    id: p.id, kelas: p.kelas, nama: p.nama, nim: p.nim, dibuat: p.dibuat, jawaban: {}
  }));
  const peta = {};
  baris.forEach((b) => { peta[b.id] = b; });
  (jawaban.results || []).forEach((r) => {
    const b = peta[r.peserta_id];
    if (!b) return;
    let v = r.nilai;
    try { v = JSON.parse(r.nilai); } catch (e) { /* teks */ }
    b.jawaban[r.butir] = v;
  });

  const butir = {};
  (jawaban.results || []).forEach((r) => { butir[r.butir] = 1; });

  try {
    const resp = await fetch(env.SHEET_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: env.SHEET_TOKEN || "",
        butir: Object.keys(butir).sort(),
        baris: baris,
        waktu: new Date().toISOString()
      })
    });
    const teks = await resp.text();
    if (!resp.ok) return galat("Google Sheets menolak: " + teks.slice(0, 300), 502);
    return json({ ok: true, baris: baris.length, jawaban: (jawaban.results || []).length, balasan: teks.slice(0, 300) });
  } catch (e) {
    return galat("Gagal menghubungi Google Sheets: " + e.message, 502);
  }
}
