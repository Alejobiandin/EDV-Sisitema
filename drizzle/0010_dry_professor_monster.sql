CREATE TABLE `accounting_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounting_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounting_journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`entry_number` int NOT NULL,
	`date` timestamp NOT NULL,
	`description` text NOT NULL,
	`status` enum('draft','posted','closed') NOT NULL DEFAULT 'posted',
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounting_journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounting_journal_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entry_id` int NOT NULL,
	`account_id` int NOT NULL,
	`debit` decimal(15,2) NOT NULL DEFAULT '0.00',
	`credit` decimal(15,2) NOT NULL DEFAULT '0.00',
	`concept` text,
	CONSTRAINT `accounting_journal_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `argentina_payroll_declarations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`total_employees` int NOT NULL,
	`grossPayroll` decimal(15,2) NOT NULL,
	`employer_contributions` decimal(15,2) NOT NULL,
	`employee_contributions` decimal(15,2) NOT NULL,
	`total_f931` decimal(15,2) NOT NULL,
	`status` enum('draft','submitted','paid') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `argentina_payroll_declarations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `argentina_tax_deadlines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tax_name` varchar(100) NOT NULL,
	`cuit_ending` varchar(10) NOT NULL,
	`due_date` timestamp NOT NULL,
	`period` varchar(20) NOT NULL,
	`status` enum('pending','completed','overdue') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `argentina_tax_deadlines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backup_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backup_type` varchar(50) NOT NULL,
	`status` varchar(32) NOT NULL,
	`s3_url` varchar(512),
	`size_bytes` int,
	`triggered_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backup_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounting_journal_entries` ADD CONSTRAINT `accounting_journal_entries_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounting_journal_lines` ADD CONSTRAINT `accounting_journal_lines_entry_id_accounting_journal_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `accounting_journal_entries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounting_journal_lines` ADD CONSTRAINT `accounting_journal_lines_account_id_accounting_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounting_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backup_audit_logs` ADD CONSTRAINT `backup_audit_logs_triggered_by_users_id_fk` FOREIGN KEY (`triggered_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;