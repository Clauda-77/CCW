CREATE TABLE `colleges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64),
	`name` varchar(255) NOT NULL,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colleges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `colleges_name_idx` ON `colleges` (`name`);