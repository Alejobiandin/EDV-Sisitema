CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role_in_org` varchar(50) NOT NULL DEFAULT 'member',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`tax_id` varchar(50) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_tax_id_unique` UNIQUE(`tax_id`)
);
