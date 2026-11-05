/* Uji /api/rekap dengan D1 tiruan — node tests/rekap.test.cjs
   Memastikan kolom percobaan (aturan + hasil) ikut di JSON dan CSV. */
const path = "file:///C:/Users/User/Documents/Hermes%20Workspace/Website%20Statmat/functions/api/rekap.js";

const baris = {
  peserta: [{ id: "p1", kelas: "9A", nama: "Ani", nim: "0608", dibuat: "2026-11-05T00:00:00.000Z" }],
  jawaban: [
    { peserta_id: "p1", bagian: "A", butir: "A1", ronde: 1, nilai: JSON.stringify("1,2,3,4,5,6"), diubah: "2026-11-05T01:00:00.000Z" },
    { peserta_id: "p1", bagian: "A", butir: "A2", ronde: 1, nilai: JSON.stringify("4"), diubah: "2026-11-05T01:01:00.000Z" },
    /* ronde 2 (setelah "Mulai ulang"): percobaan pertama TIDAK boleh tertimpa */
    { peserta_id: "p1", bagian: "A", butir: "A1", ronde: 2, nilai: JSON.stringify("1,3,5"), diubah: "2026-11-05T02:00:00.000Z" }
  ],
  lemparan: [
    { peserta_id: "p1", bagian: "A", ronde: 1, deret: JSON.stringify([4]), aturan: "muncul angka 6", x: 0 },
    { peserta_id: "p1", bagian: "A", ronde: 2, deret: JSON.stringify([3]), aturan: "muncul ganjil", x: 1 }
  ]
};

function cocok(sql, kata) { return sql.indexOf(kata) >= 0; }

function prepared(sql) {
  const inti = {
    async all() {
      if (cocok(sql, "FROM peserta")) return { results: baris.peserta };
      if (cocok(sql, "FROM jawaban")) return { results: baris.jawaban };
      if (cocok(sql, "FROM lemparan")) return { results: baris.lemparan };
      return { results: [] };
    },
    async first() {
      if (cocok(sql, "FROM kode")) return { peran: "dev", aktif: 1, kedaluwarsa: null };
      return null;
    },
    async run() { return { meta: { changes: 1 } }; }
  };
  inti.bind = function () { return inti; };
  return inti;
}

const env = {
  DB: { prepare: prepared },
  SESI_SECRET: "rahasia-uji"
};

let ok = 0, fail = 0;
function check(c, m) { if (c) ok++; else { fail++; console.log("FAIL:", m); } }

(async () => {
  const mod = await import(path);

  const reqJson = new Request("https://contoh.pages.dev/api/rekap?token=DEV-UJI");
  const resJson = await mod.onRequestGet({ request: reqJson, env });
  const data = await resJson.json();
  check(resJson.status === 200 && data.ok, "json: 200 ok");
  check(Array.isArray(data.bagian) && data.bagian[0] === "A", "json: bagian = " + JSON.stringify(data.bagian));
  const p = data.baris[0].lemparan && data.baris[0].lemparan.A;
  check(p && p.deret[0] === 3 && p.aturan === "muncul ganjil" && p.x === 1,
    "json: lemparan A = ronde terbaru " + JSON.stringify(p));
  check(p && p.ronde === 2, "json: lemparan A memuat ronde 2");
  check(data.baris[0].ronde === 2, "json: ronde peserta = 2 -> " + data.baris[0].ronde);
  check(data.baris[0].jawaban.A1 === "1,3,5", "json: A1 = ronde terbaru -> " + data.baris[0].jawaban.A1);
  check(data.baris[0].rondeButir.A1 === 2 && data.baris[0].rondeButir.A2 === 1,
    "json: ronde per butir -> " + JSON.stringify(data.baris[0].rondeButir));
  check(Array.isArray(data.baris[0].riwayat) && data.baris[0].riwayat.length === 3,
    "json: riwayat menyimpan semua ronde -> " + (data.baris[0].riwayat || []).length);
  check((data.baris[0].riwayat || []).filter((r) => r.butir === "A1").length === 2,
    "json: A1 punya dua riwayat (ronde 1 & 2)");
  check(data.butir.join(",") === "A1,A2", "json: butir = " + data.butir.join(","));

  const reqCsv = new Request("https://contoh.pages.dev/api/rekap?format=csv&token=DEV-UJI");
  const resCsv = await mod.onRequestGet({ request: reqCsv, env });
  const csv = await resCsv.text();
  const kepala = csv.split("\r\n")[0];
  check(/aturan_A/.test(kepala), "csv: kepala memuat aturan_A -> " + kepala);
  check(/hasil_A/.test(kepala), "csv: kepala memuat hasil_A");
  check(/(^|,)ronde(,|$)/.test(kepala), "csv: kepala memuat kolom ronde");
  check(/ronde_tiap_butir/.test(kepala), "csv: kepala memuat ronde_tiap_butir");
  check(/3 · S/.test(csv), "csv: hasil percobaan ronde terbaru '3 · S'");

  /* CSV panjang: satu baris per ronde, jadi percobaan 1 & 2 bisa dibedakan */
  const resPanjang = await mod.onRequestGet({
    request: new Request("https://contoh.pages.dev/api/rekap?format=csv&bentuk=panjang&token=DEV-UJI"),
    env
  });
  const csvPanjang = await resPanjang.text();
  const kepalaPanjang = csvPanjang.split("\r\n")[0];
  check(/(^|,)ronde(,|$)/.test(kepalaPanjang), "csv panjang: ada kolom ronde -> " + kepalaPanjang);
  check(/,1,A,A1,/.test(csvPanjang) && /,2,A,A1,/.test(csvPanjang),
    "csv panjang: A1 muncul di ronde 1 dan ronde 2");

  /* kode lama (tanpa kolom aturan/x) tidak boleh membuat rekap gagal */
  const envLama = {
    SESI_SECRET: "rahasia-uji",
    DB: {
      prepare(sql) {
        if (cocok(sql, "l.aturan")) throw new Error("no such column: l.aturan");
        return prepared(sql);
      }
    }
  };
  const resLama = await mod.onRequestGet({
    request: new Request("https://contoh.pages.dev/api/rekap?token=DEV-UJI"),
    env: envLama
  });
  const dataLama = await resLama.json();
  check(resLama.status === 200 && dataLama.ok, "fallback D1 lama tetap 200");

  console.log(`OK ${ok} / FAIL ${fail}`);
  process.exit(fail ? 1 : 0);
})();
