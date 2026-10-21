SET @has_related_memo := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memos' AND COLUMN_NAME = 'relatedMemoId'
);
SET @sql := IF(@has_related_memo = 0,
  'ALTER TABLE `memos` ADD COLUMN `relatedMemoId` int NULL AFTER `warehouseId`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_related_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memos' AND INDEX_NAME = 'memos_related_idx'
);
SET @sql := IF(@has_related_idx = 0,
  'ALTER TABLE `memos` ADD INDEX `memos_related_idx` (`relatedMemoId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
