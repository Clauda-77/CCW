CREATE TABLE IF NOT EXISTS `financialEntries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entryNumber` varchar(128) NOT NULL,
  `entryDate` timestamp NOT NULL,
  `warehouseId` int NOT NULL,
  `invoiceNumber` varchar(128),
  `referenceNumber` varchar(128),
  `amount` decimal(18,2) NOT NULL DEFAULT '0',
  `currency` varchar(16) NOT NULL DEFAULT 'SYP',
  `description` text,
  `source` enum('manual','excel','legacy') NOT NULL DEFAULT 'manual',
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `financial_entries_number_warehouse_uq` (`entryNumber`, `warehouseId`),
  KEY `financial_entries_date_idx` (`entryDate`),
  KEY `financial_entries_invoice_idx` (`invoiceNumber`),
  KEY `financial_entries_warehouse_idx` (`warehouseId`),
  CONSTRAINT `financialEntries_warehouseId_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `financialEntries_createdBy_fk` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memoReconciliations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `memoId` int NOT NULL,
  `financialEntryId` int,
  `status` enum('pending','matched','mismatch','not_found','waived') NOT NULL DEFAULT 'pending',
  `differenceAmount` decimal(18,2) NOT NULL DEFAULT '0',
  `matchedBy` int,
  `matchedAt` timestamp NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `memo_reconciliations_memo_uq` (`memoId`),
  KEY `memo_reconciliations_status_idx` (`status`),
  CONSTRAINT `memoReconciliations_memoId_fk` FOREIGN KEY (`memoId`) REFERENCES `memos` (`id`),
  CONSTRAINT `memoReconciliations_financialEntryId_fk` FOREIGN KEY (`financialEntryId`) REFERENCES `financialEntries` (`id`),
  CONSTRAINT `memoReconciliations_matchedBy_fk` FOREIGN KEY (`matchedBy`) REFERENCES `users` (`id`)
);
--> statement-breakpoint
ALTER TABLE `userwarehouses` ADD UNIQUE KEY `userwarehouses_user_warehouse_uq` (`userId`, `warehouseId`);
ALTER TABLE `userwarehouses` ADD CONSTRAINT `userwarehouses_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);
ALTER TABLE `userwarehouses` ADD CONSTRAINT `userwarehouses_warehouseId_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`);
--> statement-breakpoint
ALTER TABLE `adminAuditLogs` MODIFY COLUMN `action` enum('memo_deleted','user_role_changed','user_created','material_created','material_updated','material_deactivated','material_deleted','warehouse_created','warehouse_updated','warehouse_deactivated','warehouse_deleted','party_created','party_updated','party_deactivated','college_created','college_updated','college_deactivated','memo_created','memo_reviewed','memo_cancelled','memo_approved','import_committed','memo_import_committed','financial_entry_created','memo_reconciled') NOT NULL;
