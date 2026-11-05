/* Uji aturan store (|A| per jenis aturan) — dijalankan: node tests/store.test.cjs */
const fs = require("fs");
const path = "C:/Users/User/Documents/Hermes Workspace/Website Statmat/src/store.js";

globalThis.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; }
};

const kode = fs.readFileSync(path, "utf8");
new Function("globalThis", kode)(globalThis);
const S = globalThis.Store;

let ok = 0, fail = 0;
function check(c, m) { if (c) ok++; else { fail++; console.log("FAIL:", m); } }

const kasus = [
  [{ jenis: "angka", n: 6 }, 1, "angka 6"],
  [{ jenis: "angka", n: 3 }, 1, "angka 3"],
  [{ jenis: "ganjil" }, 3, "ganjil"],
  [{ jenis: "genap" }, 3, "genap"],
  [{ jenis: "min", n: 5 }, 2, "min 5"],
  [{ jenis: "min", n: 2 }, 5, "min 2"],
  [{ jenis: "maks", n: 2 }, 2, "maks 2"],
  [{ jenis: "maks", n: 5 }, 5, "maks 5"],
  [{ jenis: "jumlah", mode: "genap" }, 18, "jumlah genap"],
  [{ jenis: "jumlah", mode: "ganjil" }, 18, "jumlah ganjil"],
  [{ jenis: "jumlah", mode: "sama", n: 7 }, 6, "jumlah = 7"]
];
kasus.forEach(([at, harap, nama]) => {
  check(S.sisiSukses(at) === harap, nama + ": |A| = " + S.sisiSukses(at) + ", harus " + harap);
  check(S.ruangTotal(at) === (at.jenis === "jumlah" ? 36 : 6), nama + ": |Ω| salah");
  check(S.peluang(at) > 0 && S.peluang(at) < 1, nama + ": p harus 0<p<1");
});

/* cocok(): yakin benar untuk contoh konkret */
check(S.cocok([6], { jenis: "angka", n: 6 }) === true, "6 cocok angka 6");
check(S.cocok([3], { jenis: "angka", n: 6 }) === false, "3 tidak cocok angka 6");
check(S.cocok([3, 4], { jenis: "jumlah", mode: "sama", n: 7 }) === true, "3+4 = 7");
check(S.cocok([3, 6], { jenis: "jumlah", mode: "sama", n: 7 }) === false, "3+6 != 7");
check(S.cocok([2, 4], { jenis: "jumlah", mode: "genap" }) === true, "2+4 genap");
check(S.cocok([6], { jenis: "jumlah", mode: "genap" }) === false, "satu dadu tidak bisa aturan jumlah");

/* lempar(): satu percobaan = satu lemparan, Misi A butuh A1 */
const s = S.baca();
S.lempar(s, 1);
check(S.rek(s, 1).hasil === null, "Misi A tidak boleh lempar sebelum A1 terisi");
S.jawab(s, "A1", "1,2,3,4,5,6");
S.lempar(s, 1);
const r1 = S.rek(s, 1);
check(r1.hasil && r1.hasil.length === 1, "Misi A: hasil tepat 1 dadu");
check(r1.riwayat.length === 1, "riwayat menyimpan percobaan");
S.lempar(s, 2);
check(S.rek(s, 2).hasil === null, "Misi B terkunci: tidak bisa lempar");
S.jawab(s, "B1", "3/6");
S.pilihAturan(s, 2, { jenis: "genap" });
S.lempar(s, 2);
check(S.rek(s, 2).hasil && S.rek(s, 2).hasil.length === 1, "Misi B: satu lemparan");
S.lempar(s, 3);
check(S.rek(s, 3).hasil === null, "Misi C terkunci: tidak bisa lempar");

/* Misi D tidak melempar */
S.jawab(s, "C1", "1/6");
S.pilihAturan(s, 3, { jenis: "jumlah", mode: "sama", n: 7 });
S.lempar(s, 3);
check(S.rek(s, 3).hasil.length === 2, "Misi C: dua dadu sekali lempar");
S.lempar(s, 4);
check(S.percobaanSelesai(s, 4) === true, "Misi D tanpa lemparan");

console.log(`OK ${ok} / FAIL ${fail}`);
process.exit(fail ? 1 : 0);
