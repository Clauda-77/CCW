ALTER TABLE `users` ADD `warehouseId` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `users_warehouse_idx` ON `users` (`warehouseId`);