ALTER TABLE `bank_connections` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_transactions` ADD `organization_id` int DEFAULT 1 NOT NULL;