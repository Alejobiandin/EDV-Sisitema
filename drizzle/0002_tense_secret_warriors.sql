CREATE TABLE `edv_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`recipientEmail` varchar(255) NOT NULL,
	`signatureHash` varchar(255) NOT NULL,
	`status` enum('signed','sent','verified','failed') NOT NULL DEFAULT 'signed',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edv_certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edv_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int,
	`clientId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`externalPaymentReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `edv_invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edv_vector_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceType` enum('rule','policy','workflow','document') NOT NULL,
	`sourceId` int NOT NULL,
	`contentChunk` text NOT NULL,
	`embeddingJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edv_vector_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `edv_clients` ADD `operatingCostRate` decimal(5,4) DEFAULT '0.3500' NOT NULL;--> statement-breakpoint
ALTER TABLE `edv_certificates` ADD CONSTRAINT `edv_certificates_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edv_invoices` ADD CONSTRAINT `edv_invoices_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edv_invoices` ADD CONSTRAINT `edv_invoices_clientId_edv_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `edv_clients`(`id`) ON DELETE no action ON UPDATE no action;