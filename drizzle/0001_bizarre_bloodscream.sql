CREATE TABLE `edv_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`taxId` varchar(50) NOT NULL,
	`taxCategory` varchar(100) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`status` enum('active','suspended','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `edv_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `edv_clients_taxId_unique` UNIQUE(`taxId`)
);
--> statement-breakpoint
CREATE TABLE `edv_employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`taxIdNumber` varchar(50) NOT NULL,
	`baseSalary` decimal(12,2) NOT NULL,
	`cct` varchar(100),
	`status` enum('active','leave','terminated') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `edv_employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `edv_employees_taxIdNumber_unique` UNIQUE(`taxIdNumber`)
);
--> statement-breakpoint
ALTER TABLE `edv_employees` ADD CONSTRAINT `edv_employees_clientId_edv_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `edv_clients`(`id`) ON DELETE no action ON UPDATE no action;