/* Utilitas bersama Cloudflare Pages Functions.
   Hash kode akses, token sesi HMAC, cookie, CSV. */

const enc = new TextEncoder();

function b64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function dariB64url(str) {
  const p = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(p + "===".slice((p.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }, headers)
  });
}

export function galat(pesan, status = 400, ekstra = {}) {
  return json(Object.assign({ ok: false, galat: pesan }, ekstra), status);
}

/* kode akses: bandingkan tanpa peduli huruf besar/kecil, spasi, dan tanda hubung */
export function normalKode(s) {
  return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function hashKode(s) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(normalKode(s)));
  return Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function kunciHmac(rahasia) {
  return crypto.subtle.importKey("raw", enc.encode(rahasia || "tanpa-rahasia"), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function ttd(payload, rahasia) {
  const isi = b64url(enc.encode(JSON.stringify(payload)));
  const k = await kunciHmac(rahasia);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(isi));
  return isi + "." + b64url(sig);
}

export function bacaCookie(request, nama) {
  const h = request.headers.get("cookie") || "";
  const bagian = h.split(";");
  for (const b of bagian) {
    const i = b.indexOf("=");
    if (i < 0) continue;
    if (b.slice(0, i).trim() === nama) return decodeURIComponent(b.slice(i + 1).trim());
  }
  return null;
}

export function setCookie(request, nama, nilai, detik) {
  const aman = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${nama}=${encodeURIComponent(nilai)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${detik}${aman}`;
}

export function hapusCookie(request, nama) {
  return setCookie(request, nama, "", 0);
}

export const NAMA_COOKIE = "rb_sesi";

/* sesi: { p: peran, k: kelas, id: peserta_id, exp: epoch ms } */
export async function bacaSesi(request, env) {
  const tok = bacaCookie(request, NAMA_COOKIE);
  if (!tok || tok.indexOf(".") < 0) return null;
  const [isi, sig] = tok.split(".");
  if (!isi || !sig) return null;
  try {
    const k = await kunciHmac(env.SESI_SECRET);
    const sah = await crypto.subtle.verify("HMAC", k, dariB64url(sig), enc.encode(isi));
    if (!sah) return null;
    const s = JSON.parse(new TextDecoder().decode(dariB64url(isi)));
    if (!s || !s.exp || s.exp < Date.now()) return null;
    return s;
  } catch (e) {
    return null;
  }
}

export function ipDari(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "lokal";
}

/* batas percobaan kode: 30 gagal / 15 menit per IP (satu kelas bisa berbagi IP NAT,
   jadi jangan terlalu ketat; 30 dari ~1 juta kemungkinan tetap tidak bisa ditebak) */
export async function batasPercobaan(env, ip) {
  const batas = 15 * 60 * 1000;
  const kini = Date.now();
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM coba WHERE ip = ? AND ts > ?"
  ).bind(ip, kini - batas).first();
  return { terlalu: (r && r.n ? r.n : 0) >= 30, n: r && r.n ? r.n : 0 };
}

export async function catatGagal(env, ip) {
  const kini = Date.now();
  await env.DB.prepare("INSERT INTO coba(ip, ts) VALUES(?, ?)").bind(ip, kini).run();
  if (Math.random() < 0.05) {
    await env.DB.prepare("DELETE FROM coba WHERE ts < ?").bind(kini - 86400000).run();
  }
}

export function csv(baris) {
  return baris.map((r) =>
    r.map((sel) => {
      const s = sel === null || sel === undefined ? "" : String(sel);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")
  ).join("\r\n");
}
