-- Adds the original source document number as a display/reference field.
-- The existing memoNumber remains unchanged and continues to provide a unique internal key.
ALTER TABLE `memos`
  ADD COLUMN `sourceMemoNumber` VARCHAR(64) NULL AFTER `memoNumber`;
