/* POST /api/keluar — hapus cookie sesi. */
import { json, hapusCookie, NAMA_COOKIE } from "./_util.js";

export async function onRequestPost({ request }) {
  return json({ ok: true }, 200, { "set-cookie": hapusCookie(request, NAMA_COOKIE) });
}
