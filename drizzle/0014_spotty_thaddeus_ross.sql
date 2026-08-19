ALTER TABLE `afip_padron_sync_log` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `backup_audit_logs` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `cct_concept_templates` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `interbanking_reconciliations` ADD `organization_id` int DEFAULT 1 NOT NULL;