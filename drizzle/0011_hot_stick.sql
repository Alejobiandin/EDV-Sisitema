CREATE TABLE `afip_padron_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cuit` varchar(20) NOT NULL,
	`taxpayer_name` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL,
	`tax_category` varchar(100),
	`sync_details` text,
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `afip_padron_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cct_concept_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cct_code` varchar(50) NOT NULL,
	`concept_name` varchar(255) NOT NULL,
	`calculation_formula` text NOT NULL,
	`remunerative` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cct_concept_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interbanking_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bank_statement_id` int NOT NULL,
	`vep_reference` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`matched_status` varchar(50) NOT NULL,
	`reconciled_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interbanking_reconciliations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liquidity_projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`projection_date` timestamp NOT NULL,
	`projected_inflow` decimal(15,2) NOT NULL,
	`projected_outflow` decimal(15,2) NOT NULL,
	`imminent_tax_liabilities` decimal(15,2) NOT NULL,
	`net_balance` decimal(15,2) NOT NULL,
	`risk_detected` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liquidity_projections_id` PRIMARY KEY(`id`)
);
