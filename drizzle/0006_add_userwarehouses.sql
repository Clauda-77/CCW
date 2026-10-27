CREATE TABLE IF NOT EXISTS `userwarehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `warehouseId` int NOT NULL,
  `assignedBy` int DEFAULT NULL,
  `assignedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userwarehouses_userId_idx` (`userId`),
  KEY `userwarehouses_warehouseId_idx` (`warehouseId`),
  KEY `userwarehouses_assignedBy_idx` (`assignedBy`)
);
