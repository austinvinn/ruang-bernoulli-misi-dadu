/* Middleware Pages Functions: menutup berkas internal dari akses publik.
   Situs ini statis + API; berkas skema/konfigurasi/dokumen kerja tidak untuk dibaca publik. */

const TERLARANG =
  /^\/(schema\.sql|wrangler\.toml|README\.md|ARCHITECTURE\.md|IDEA\.md|package\.json|package-lock\.json|\.dev\.vars|\.assetsignore|\.gitignore|mockup[\w.-]*\.html|(docs|tests|design|scripts|vendor\/src)\/)/i;

export async function onRequest({ request, next }) {
  const jalur = new URL(request.url).pathname;
  if (TERLARANG.test(jalur)) {
    return new Response("Tidak ditemukan.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }
  return next();
}
