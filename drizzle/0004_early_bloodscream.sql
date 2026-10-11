CREATE TABLE `adminAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`action` enum('memo_deleted','user_role_changed') NOT NULL,
	`entityType` enum('memo','user') NOT NULL,
	`entityId` int NOT NULL,
	`entityLabel` varchar(255),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adminAuditLogs` ADD CONSTRAINT `adminAuditLogs_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_audit_actor_idx` ON `adminAuditLogs` (`actorId`);--> statement-breakpoint
CREATE INDEX `admin_audit_created_idx` ON `adminAuditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `admin_audit_entity_idx` ON `adminAuditLogs` (`entityType`,`entityId`);