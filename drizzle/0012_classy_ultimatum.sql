ALTER TABLE `edv_clients` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `edv_invoices` ADD `organization_id` int DEFAULT 1 NOT NULL;