const L = require('C:/Users/User/Documents/Hermes Workspace/Website Statmat/src/laporan.js');
let fail = 0, ok = 0;
function check(cond, msg){ if(cond) ok++; else { fail++; console.log('FAIL:', msg); } }

// 1. roundtrip menyeluruh
for (let misi = 1; misi <= 5; misi++) {
  for (const aturan of [0,1,2,3,4,5,6]) {
    for (const [n,k] of [[0,0],[1,0],[1,1],[10,3],[100,17],[500,83],[1023,1023]]) {
      if (k > n) continue;
      const code = L.encode({misi, aturan, n, k});
      const d = L.decode(code);
      check(d.ok && d.misi===misi && d.aturan===aturan && d.n===n && d.k===k,
        `roundtrip ${misi}/${aturan}/${n}/${k} -> ${code} -> ${JSON.stringify(d)}`);
    }
  }
}

// 2. checksum menolak semua varian salah-ketik 1 karakter
const valid = L.encode({misi:3, aturan:1, n:100, k:17});
const clean = valid.replace('-','');
let rejected = 0, tried = 0;
for (let i = 0; i < 7; i++) {
  for (const ch of '0123456789ABCDEFGHJKMNPQRSTVWXYZ') {
    if (ch === clean[i]) continue;
    tried++;
    const bad = clean.slice(0,i) + ch + clean.slice(i+1);
    if (!L.decode(bad).ok) rejected++;
  }
}
check(rejected === tried, `semua ${tried} varian harus ditolak (ditolak ${rejected})`);

// 3. toleransi tulis tangan
check(L.decode(valid.replace('-',' ')).ok, 'spasi sebagai pemisah');
check(L.decode('MD6' + clean).ok, 'prefix MD6');
check(L.decode(valid.toLowerCase()).ok, 'huruf kecil');

// 4. pesan galat jelas, tidak crash
const bad1 = L.decode('ABC');
check(!bad1.ok && /7 atau 8 karakter/.test(bad1.error), 'panjang salah: ' + JSON.stringify(bad1));

// 5. parseMany + label
const txt = `OUT-XXX\n${L.encode({misi:2,aturan:1,n:10,k:2})} Rani\n${L.encode({misi:2,aturan:1,n:10,k:1})}, Budi\n\n${valid}\n`;
const pm = L.parseMany(txt);
check(pm.entries.length === 3, 'parseMany valid=3, dapat ' + pm.entries.length + ' invalid=' + JSON.stringify(pm.invalid));
check(pm.invalid.length === 1, 'baris sampah terdeteksi');
check(pm.entries[0].label === 'Rani' && pm.entries[1].label === 'Budi', 'label: ' + JSON.stringify(pm.entries.map(e => e.label)));

// 6. pool = Σk/Σn, bukan rata-rata p̂
const pool = L.pool(pm.entries);
const manual = (2+1+17)/(10+10+100);
check(Math.abs(pool.phat - manual) < 1e-12, `pooled ${pool.phat} vs ${manual}`);
const rataRata = (0.2+0.1+0.17)/3;
check(Math.abs(pool.phat - rataRata) > 1e-6, 'pooled harus beda dari rata-rata p̂');

// 7. format
check(/^[0-9A-Z]{4}-[0-9A-Z]{3}$/.test(valid), 'format kode: ' + valid);

// 8. kode versi 2 — satu percobaan = satu lemparan
for (let misi = 1; misi <= 5; misi++) {
  for (const dua of [false, true]) {
    const total = dua ? 36 : 6;
    for (const sisi of [1, 2, 3, 6, total]) {
      if (sisi > total) continue;
      for (const x of [0, 1]) {
        const code = L.encodeHasil({ misi, duaDadu: dua, sisi, x });
        const d = L.decode(code);
        check(d.ok && d.versi === 2 && d.misi === misi && d.dadu === (dua ? 2 : 1) &&
          d.sisi === sisi && d.x === x && Math.abs(d.p - sisi / total) < 1e-12,
          `v2 roundtrip ${misi}/${dua}/${sisi}/${x} -> ${code} -> ${JSON.stringify(d)}`);
      }
    }
  }
}

// 9. salah ketik kode versi 2 harus ditolak checksum
const v2 = L.encodeHasil({ misi: 3, duaDadu: true, sisi: 18, x: 1 });
const v2clean = v2.replace('-', '');
let rej2 = 0, try2 = 0;
for (let i = 0; i < 8; i++) {
  for (const ch of '0123456789ABCDEFGHJKMNPQRSTVWXYZ') {
    if (ch === v2clean[i]) continue;
    try2++;
    if (!L.decode(v2clean.slice(0, i) + ch + v2clean.slice(i + 1)).ok) rej2++;
  }
}
check(rej2 === try2, `v2: semua ${try2} salah ketik ditolak (ditolak ${rej2})`);
check(L.decode(v2.replace('-', '')).ok, 'v2 tanpa tanda hubung');
check(L.decode('MD6' + v2clean).ok, 'v2 dengan prefix MD6');

console.log(`\nOK ${ok} / FAIL ${fail}`);
console.log('Contoh: misi3/n=100/k=17 ->', valid, '| decode phat =', L.decode(valid).phat.toFixed(3));
console.log('Pool: n=' + pool.n + ' k=' + pool.k + ' phat=' + pool.phat.toFixed(4) + ' se=' + (pool.se||0).toFixed(4));
process.exit(fail ? 1 : 0);
