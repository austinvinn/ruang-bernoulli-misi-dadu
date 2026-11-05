-- Migrasi untuk basis data yang sudah ada (v4: aturan + hasil per percobaan).
-- Jalankan sekali: npx wrangler d1 execute misi-dadu-db --remote --file=migrations/2026-11-05-lemparan-aturan.sql
ALTER TABLE lemparan ADD COLUMN aturan TEXT NOT NULL DEFAULT '';
ALTER TABLE lemparan ADD COLUMN x INTEGER;
