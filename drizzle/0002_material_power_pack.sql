ALTER TABLE `memos` ADD `folderNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `memos` ADD `orderNumber` varchar(128);--> statement-breakpoint
ALTER TABLE `memos` ADD `orderDate` timestamp;--> statement-breakpoint
ALTER TABLE `memos` ADD `invoiceNumber` varchar(128);--> statement-breakpoint
ALTER TABLE `memos` ADD `invoiceDate` timestamp;