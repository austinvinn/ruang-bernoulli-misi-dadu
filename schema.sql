-- Skema D1 "Ruang Bernoulli: Misi Dadu"
-- Terapkan: npx wrangler d1 execute misi-dadu-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS kode (
  kode_hash   TEXT PRIMARY KEY,
  label       TEXT NOT NULL DEFAULT '',
  kelas       TEXT NOT NULL DEFAULT '',
  peran       TEXT NOT NULL DEFAULT 'siswa' CHECK (peran IN ('siswa','dev','baca')),
  aktif       INTEGER NOT NULL DEFAULT 1,
  kedaluwarsa TEXT,
  dibuat      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS peserta (
  id        TEXT PRIMARY KEY,
  kelas     TEXT NOT NULL DEFAULT '',
  nama      TEXT NOT NULL DEFAULT '',
  nim       TEXT NOT NULL DEFAULT '',
  dibuat    TEXT NOT NULL,
  kode_hash TEXT
);

CREATE TABLE IF NOT EXISTS jawaban (
  peserta_id TEXT NOT NULL,
  bagian     TEXT NOT NULL,
  butir      TEXT NOT NULL,
  ronde      INTEGER NOT NULL DEFAULT 1,
  nilai      TEXT NOT NULL,
  diubah     TEXT NOT NULL,
  PRIMARY KEY (peserta_id, bagian, butir, ronde)
);

/* Satu percobaan = satu lemparan: deret berisi 1 angka (satu dadu) atau
   2 angka (dua dadu). aturan = aturan sukses yang dipilih siswa,
   x = hasil (1 sukses, 0 gagal). ronde = percobaan ke-berapa di perangkat
   siswa (naik setiap "Mulai ulang" / "Hapus data saya"), supaya percobaan
   pertama tidak tertimpa percobaan kedua. */
CREATE TABLE IF NOT EXISTS lemparan (
  peserta_id TEXT NOT NULL,
  bagian     TEXT NOT NULL,
  ronde      INTEGER NOT NULL DEFAULT 1,
  deret      TEXT NOT NULL,
  aturan     TEXT NOT NULL DEFAULT '',
  x          INTEGER,
  diubah     TEXT NOT NULL,
  PRIMARY KEY (peserta_id, bagian, ronde)
);

CREATE TABLE IF NOT EXISTS coba (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_peserta_kelas  ON peserta(kelas);
CREATE INDEX IF NOT EXISTS idx_jawaban_butir  ON jawaban(butir);
CREATE INDEX IF NOT EXISTS idx_coba_ip        ON coba(ip, ts);
