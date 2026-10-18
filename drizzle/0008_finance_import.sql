CREATE TABLE IF NOT EXISTS `financialEntries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entryNumber` varchar(128) NOT NULL,
  `entryDate` timestamp NOT NULL,
  `warehouseId` int NOT NULL,
  `invoiceNumber` varchar(128),
  `disbursementNumber` varchar(128),
  `receiptMemoNumber` varchar(128),
  `referenceNumber` varchar(128),
  `amount` decimal(18,2) NOT NULL DEFAULT '0',
  `currency` varchar(16) NOT NULL DEFAULT 'SYP',
  `description` text,
  `source` enum('manual','excel','legacy','memo_auto') NOT NULL DEFAULT 'manual',
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `financial_entries_number_warehouse_uq` (`entryNumber`, `warehouseId`),
  KEY `financial_entries_date_idx` (`entryDate`),
  KEY `financial_entries_invoice_idx` (`invoiceNumber`),
  KEY `financial_entries_disbursement_idx` (`disbursementNumber`),
  KEY `financial_entries_receipt_memo_idx` (`receiptMemoNumber`),
  KEY `financial_entries_warehouse_idx` (`warehouseId`),
  CONSTRAINT `financialEntries_warehouseId_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `financialEntries_createdBy_fk` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
);
--> statement-breakpoint

SET @has_invoice := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financialEntries' AND COLUMN_NAME = 'invoiceNumber'
);
SET @sql := IF(@has_invoice = 0, 'ALTER TABLE `financialEntries` ADD COLUMN `invoiceNumber` varchar(128) NULL AFTER `warehouseId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_disbursement := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financialEntries' AND COLUMN_NAME = 'disbursementNumber'
);
SET @sql := IF(@has_disbursement = 0, 'ALTER TABLE `financialEntries` ADD COLUMN `disbursementNumber` varchar(128) NULL AFTER `invoiceNumber`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_receipt_memo := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financialEntries' AND COLUMN_NAME = 'receiptMemoNumber'
);
SET @sql := IF(@has_receipt_memo = 0, 'ALTER TABLE `financialEntries` ADD COLUMN `receiptMemoNumber` varchar(128) NULL AFTER `disbursementNumber`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_source := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financialEntries' AND COLUMN_NAME = 'source'
);
SET @sql := IF(@has_source = 0, 'ALTER TABLE `financialEntries` ADD COLUMN `source` enum(''manual'',''excel'',''legacy'',''memo_auto'') NOT NULL DEFAULT ''manual''', 'ALTER TABLE `financialEntries` MODIFY COLUMN `source` enum(''manual'',''excel'',''legacy'',''memo_auto'') NOT NULL DEFAULT ''manual''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_import_finance := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'importBatches' AND COLUMN_NAME = 'category'
);
SET @sql := IF(@has_import_finance > 0, 'ALTER TABLE `importBatches` MODIFY COLUMN `category` enum(''materials'',''balances'',''memos'',''parties'',''finance'') NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
