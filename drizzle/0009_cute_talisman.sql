CREATE TABLE `tax_sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`sync_type` varchar(50) NOT NULL,
	`status` varchar(32) NOT NULL,
	`details` text,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_sync_logs_id` PRIMARY KEY(`id`)
);
