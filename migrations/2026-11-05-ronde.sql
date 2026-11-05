-- Ronde: setiap "Mulai ulang" / "Hapus data saya" menaikkan nomor ronde di perangkat.
-- Jawaban & lemparan sekarang berkunci (peserta, ..., ronde) sehingga percobaan
-- pertama TIDAK tertimpa percobaan kedua. Ronde 1 = data yang sudah ada.
-- Terapkan: npx wrangler d1 execute misi-dadu-db --remote --file=migrations/2026-11-05-ronde.sql

CREATE TABLE IF NOT EXISTS jawaban_baru (
  peserta_id TEXT NOT NULL,
  bagian     TEXT NOT NULL,
  butir      TEXT NOT NULL,
  ronde      INTEGER NOT NULL DEFAULT 1,
  nilai      TEXT NOT NULL,
  diubah     TEXT NOT NULL,
  PRIMARY KEY (peserta_id, bagian, butir, ronde)
);

INSERT INTO jawaban_baru(peserta_id, bagian, butir, ronde, nilai, diubah)
  SELECT peserta_id, bagian, butir, 1, nilai, diubah FROM jawaban;

DROP TABLE jawaban;
ALTER TABLE jawaban_baru RENAME TO jawaban;
CREATE INDEX IF NOT EXISTS idx_jawaban_butir ON jawaban(butir);

CREATE TABLE IF NOT EXISTS lemparan_baru (
  peserta_id TEXT NOT NULL,
  bagian     TEXT NOT NULL,
  ronde      INTEGER NOT NULL DEFAULT 1,
  deret      TEXT NOT NULL,
  aturan     TEXT NOT NULL DEFAULT '',
  x          INTEGER,
  diubah     TEXT NOT NULL,
  PRIMARY KEY (peserta_id, bagian, ronde)
);

INSERT INTO lemparan_baru(peserta_id, bagian, ronde, deret, aturan, x, diubah)
  SELECT peserta_id, bagian, 1, deret, aturan, x, diubah FROM lemparan;

DROP TABLE lemparan;
ALTER TABLE lemparan_baru RENAME TO lemparan;
