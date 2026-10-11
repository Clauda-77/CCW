CREATE TABLE `importBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('materials','balances','memos','parties') NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`storageKey` varchar(500),
	`status` enum('uploaded','validating','validated','imported','failed') NOT NULL DEFAULT 'uploaded',
	`totalRows` int NOT NULL DEFAULT 0,
	`importedRows` int NOT NULL DEFAULT 0,
	`errorSummary` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `importBatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`partyId` int,
	`openingQuantity` decimal(15,3) NOT NULL DEFAULT '0',
	`onHandQuantity` decimal(15,3) NOT NULL DEFAULT '0',
	`reservedQuantity` decimal(15,3) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryBalances_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_balance_scope_uq` UNIQUE(`materialId`,`warehouseId`,`partyId`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`unit` varchar(64) NOT NULL,
	`barcode` varchar(128),
	`minimumStock` decimal(15,3) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `memoItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memoId` int NOT NULL,
	`materialId` int NOT NULL,
	`quantity` decimal(15,3) NOT NULL,
	`unitPrice` decimal(18,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('inbound','outbound') NOT NULL,
	`memoNumber` varchar(64) NOT NULL,
	`status` enum('draft','pending_review','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`warehouseId` int NOT NULL,
	`partyId` int,
	`referenceNumber` varchar(128),
	`referenceDate` timestamp,
	`memoDate` timestamp NOT NULL,
	`notes` text,
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`approvedBy` int,
	`reviewedAt` timestamp,
	`approvedAt` timestamp,
	`printedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memos_id` PRIMARY KEY(`id`),
	CONSTRAINT `memos_type_number_uq` UNIQUE(`type`,`memoNumber`)
);
--> statement-breakpoint
CREATE TABLE `parties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legacyNumber` varchar(64),
	`name` varchar(255) NOT NULL,
	`type` enum('supplier','recipient','both','internal') NOT NULL DEFAULT 'both',
	`phone` varchar(64),
	`address` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`partyId` int,
	`memoId` int,
	`memoItemId` int,
	`movementType` enum('opening','inbound','outbound','adjustment','transfer_in','transfer_out') NOT NULL,
	`quantityIn` decimal(15,3) NOT NULL DEFAULT '0',
	`quantityOut` decimal(15,3) NOT NULL DEFAULT '0',
	`occurredAt` timestamp NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kind` enum('central','branch','storage') NOT NULL DEFAULT 'branch',
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','warehouse_keeper','data_entry','reviewer','admin') NOT NULL DEFAULT 'data_entry';--> statement-breakpoint
ALTER TABLE `importBatches` ADD CONSTRAINT `importBatches_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryBalances` ADD CONSTRAINT `inventoryBalances_materialId_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryBalances` ADD CONSTRAINT `inventoryBalances_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryBalances` ADD CONSTRAINT `inventoryBalances_partyId_parties_id_fk` FOREIGN KEY (`partyId`) REFERENCES `parties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoItems` ADD CONSTRAINT `memoItems_memoId_memos_id_fk` FOREIGN KEY (`memoId`) REFERENCES `memos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoItems` ADD CONSTRAINT `memoItems_materialId_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memos` ADD CONSTRAINT `memos_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memos` ADD CONSTRAINT `memos_partyId_parties_id_fk` FOREIGN KEY (`partyId`) REFERENCES `parties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memos` ADD CONSTRAINT `memos_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memos` ADD CONSTRAINT `memos_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memos` ADD CONSTRAINT `memos_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockMovements` ADD CONSTRAINT `stockMovements_materialId_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockMovements` ADD CONSTRAINT `stockMovements_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockMovements` ADD CONSTRAINT `stockMovements_partyId_parties_id_fk` FOREIGN KEY (`partyId`) REFERENCES `parties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockMovements` ADD CONSTRAINT `stockMovements_memoId_memos_id_fk` FOREIGN KEY (`memoId`) REFERENCES `memos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockMovements` ADD CONSTRAINT `stockMovements_memoItemId_memoItems_id_fk` FOREIGN KEY (`memoItemId`) REFERENCES `memoItems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockMovements` ADD CONSTRAINT `stockMovements_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `inventory_balance_material_idx` ON `inventoryBalances` (`materialId`);--> statement-breakpoint
CREATE INDEX `inventory_balance_warehouse_idx` ON `inventoryBalances` (`warehouseId`);--> statement-breakpoint
CREATE INDEX `materials_name_idx` ON `materials` (`name`);--> statement-breakpoint
CREATE INDEX `materials_barcode_idx` ON `materials` (`barcode`);--> statement-breakpoint
CREATE INDEX `memo_items_memo_idx` ON `memoItems` (`memoId`);--> statement-breakpoint
CREATE INDEX `memo_items_material_idx` ON `memoItems` (`materialId`);--> statement-breakpoint
CREATE INDEX `memos_status_idx` ON `memos` (`status`);--> statement-breakpoint
CREATE INDEX `memos_date_idx` ON `memos` (`memoDate`);--> statement-breakpoint
CREATE INDEX `memos_party_idx` ON `memos` (`partyId`);--> statement-breakpoint
CREATE INDEX `parties_name_idx` ON `parties` (`name`);--> statement-breakpoint
CREATE INDEX `stock_movements_material_date_idx` ON `stockMovements` (`materialId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `stock_movements_warehouse_date_idx` ON `stockMovements` (`warehouseId`,`occurredAt`);