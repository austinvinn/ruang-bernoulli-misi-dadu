/**
 * Apps Script — dorong rekap Misi Dadu ke Google Sheets (OPSIONAL, untuk pembaruan instan).
 *
 * Cara pasang (5 menit):
 * 1. Buka spreadsheet "Rekap Misi Dadu" → menu Extensions › Apps Script.
 * 2. Hapus isi Code.gs, tempel seluruh berkas ini, simpan.
 * 3. Project Settings › Script properties › Add script property:
 *      TOKEN = <token rahasia pilihanmu>   (mis. 32 huruf acak)
 * 4. Deploy › New deployment › Select type "Web app"
 *      Execute as: Me · Who has access: Anyone
 *    Salin URL /exec yang muncul.
 * 5. Di Cloudflare, simpan URL itu dan token yang sama:
 *      npx wrangler pages secret put SHEET_URL   --project-name=misi-dadu
 *      npx wrangler pages secret put SHEET_TOKEN --project-name=misi-dadu
 * 6. Buka https://misi-dadu.pages.dev/rekap.html sebagai pengembang → tombol
 *    "Sinkron ke Google Sheets".
 *
 * Sheet tujuan: tab bernama "Data" (dibuat otomatis kalau belum ada).
 */

var TAB = "Data";

function doPost(e) {
  try {
    var isi = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty("TOKEN");
    if (token && String(isi.token || "") !== String(token)) {
      return jawab({ ok: false, galat: "token salah" });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TAB) || ss.insertSheet(TAB);

    var butir = isi.butir || [];
    var kepala = ["kelas", "nama", "nim", "peserta", "dibuat"].concat(butir).concat(["jumlah_butir", "disinkron"]);
    sh.clearContents();
    sh.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight("bold");
    sh.setFrozenRows(1);

    var baris = (isi.baris || []).map(function (b) {
      var sel = [b.kelas || "", b.nama || "", b.nim || "", b.id || "", b.dibuat || ""];
      var n = 0;
      butir.forEach(function (id) {
        var v = (b.jawaban || {})[id];
        if (v === undefined) { sel.push(""); return; }
        n++;
        sel.push(typeof v === "string" ? v : JSON.stringify(v));
      });
      sel.push(n);
      sel.push(isi.waktu || new Date().toISOString());
      return sel;
    });
    if (baris.length) sh.getRange(2, 1, baris.length, kepala.length).setValues(baris);

    return jawab({ ok: true, baris: baris.length, butir: butir.length });
  } catch (err) {
    return jawab({ ok: false, galat: String(err) });
  }
}

function jawab(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
