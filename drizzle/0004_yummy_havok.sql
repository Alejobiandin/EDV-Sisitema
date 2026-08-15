CREATE TABLE `bank_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`institution` varchar(255) NOT NULL,
	`provider` varchar(100) NOT NULL,
	`accountMasked` varchar(100),
	`secretRef` varchar(255) NOT NULL,
	`status` enum('pending','active','error','disabled') NOT NULL DEFAULT 'pending',
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankConnectionId` int NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`bookedAt` timestamp NOT NULL,
	`description` text,
	`amount` decimal(18,2) NOT NULL,
	`direction` enum('credit','debit') NOT NULL,
	`status` enum('unmatched','matched','ignored','review') NOT NULL DEFAULT 'unmatched',
	`matchedInvoiceId` int,
	`rawPayload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_transactions_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
ALTER TABLE `bank_transactions` ADD CONSTRAINT `bank_transactions_bankConnectionId_bank_connections_id_fk` FOREIGN KEY (`bankConnectionId`) REFERENCES `bank_connections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bank_transactions` ADD CONSTRAINT `bank_transactions_matchedInvoiceId_edv_invoices_id_fk` FOREIGN KEY (`matchedInvoiceId`) REFERENCES `edv_invoices`(`id`) ON DELETE no action ON UPDATE no action;