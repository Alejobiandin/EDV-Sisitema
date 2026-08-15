ALTER TABLE `agents` ADD `code` varchar(100);--> statement-breakpoint
ALTER TABLE `agents` ADD `autonomyLevel` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `capabilitiesJson` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `parentAgentId` int;--> statement-breakpoint
ALTER TABLE `organizational_dna_rules` ADD `jurisdiction` varchar(100);--> statement-breakpoint
ALTER TABLE `organizational_dna_rules` ADD `collectiveAgreement` varchar(150);--> statement-breakpoint
ALTER TABLE `organizational_dna_rules` ADD `effectiveFrom` timestamp;--> statement-breakpoint
ALTER TABLE `organizational_dna_rules` ADD `effectiveTo` timestamp;--> statement-breakpoint
ALTER TABLE `organizational_dna_rules` ADD `priority` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `organizational_dna_rules` ADD `isActive` int DEFAULT 1 NOT NULL;