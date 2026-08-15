CREATE TABLE `tax_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`environment` varchar(32) NOT NULL DEFAULT 'homologation',
	`cuit` varchar(50) NOT NULL,
	`point_of_sale` int NOT NULL DEFAULT 1,
	`cert_storage_key` varchar(512),
	`key_storage_key` varchar(512),
	`status` varchar(32) NOT NULL DEFAULT 'pending_verification',
	`last_verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_configurations_id` PRIMARY KEY(`id`)
);
