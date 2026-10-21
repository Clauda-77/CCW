CREATE TABLE `financialEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financialEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_entries_number_warehouse_uq` UNIQUE(`entryNumber`,`warehouseId`)
);
--> statement-breakpoint
CREATE TABLE `memoReconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memoId` int NOT NULL,
	`financialEntryId` int,
	`status` enum('pending','matched','mismatch','not_found','waived') NOT NULL DEFAULT 'pending',
	`differenceAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`matchedBy` int,
	`matchedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoReconciliations_id` PRIMARY KEY(`id`),
	CONSTRAINT `memo_reconciliations_memo_uq` UNIQUE(`memoId`)
);
--> statement-breakpoint
ALTER TABLE `adminAuditLogs` MODIFY COLUMN `action` enum('memo_deleted','user_role_changed','user_created','material_created','material_updated','material_deactivated','material_deleted','warehouse_created','warehouse_updated','warehouse_deactivated','warehouse_deleted','party_created','party_updated','party_deactivated','college_created','college_updated','college_deactivated','memo_created','memo_reviewed','memo_cancelled','memo_approved','import_committed','memo_import_committed','financial_entry_created','memo_reconciled') NOT NULL;--> statement-breakpoint
ALTER TABLE `importBatches` MODIFY COLUMN `category` enum('materials','balances','memos','parties','finance') NOT NULL;--> statement-breakpoint
ALTER TABLE `memos` ADD `relatedMemoId` int;--> statement-breakpoint
ALTER TABLE `userwarehouses` ADD CONSTRAINT `userwarehouses_user_warehouse_uq` UNIQUE(`userId`,`warehouseId`);--> statement-breakpoint
ALTER TABLE `financialEntries` ADD CONSTRAINT `financialEntries_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financialEntries` ADD CONSTRAINT `financialEntries_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoReconciliations` ADD CONSTRAINT `memoReconciliations_memoId_memos_id_fk` FOREIGN KEY (`memoId`) REFERENCES `memos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoReconciliations` ADD CONSTRAINT `memoReconciliations_financialEntryId_financialEntries_id_fk` FOREIGN KEY (`financialEntryId`) REFERENCES `financialEntries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoReconciliations` ADD CONSTRAINT `memoReconciliations_matchedBy_users_id_fk` FOREIGN KEY (`matchedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `financial_entries_date_idx` ON `financialEntries` (`entryDate`);--> statement-breakpoint
CREATE INDEX `financial_entries_invoice_idx` ON `financialEntries` (`invoiceNumber`);--> statement-breakpoint
CREATE INDEX `financial_entries_disbursement_idx` ON `financialEntries` (`disbursementNumber`);--> statement-breakpoint
CREATE INDEX `financial_entries_receipt_memo_idx` ON `financialEntries` (`receiptMemoNumber`);--> statement-breakpoint
CREATE INDEX `financial_entries_warehouse_idx` ON `financialEntries` (`warehouseId`);--> statement-breakpoint
CREATE INDEX `memo_reconciliations_status_idx` ON `memoReconciliations` (`status`);--> statement-breakpoint
CREATE INDEX `memos_related_idx` ON `memos` (`relatedMemoId`);