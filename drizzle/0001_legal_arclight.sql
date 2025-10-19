CREATE TABLE `contributions` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`cycle` int NOT NULL,
	`txHash` varchar(255),
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `contributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lightningInvoices` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`groupId` varchar(64),
	`paymentRequest` text NOT NULL,
	`paymentHash` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','paid','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`paidAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `lightningInvoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`cycle` int NOT NULL,
	`txHash` varchar(255),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tontineGroups` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`creatorId` varchar(64) NOT NULL,
	`contributionAmount` int NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL,
	`maxMembers` int NOT NULL,
	`currentMembers` int NOT NULL DEFAULT 1,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`multiSigAddress` varchar(255),
	`currentCycle` int NOT NULL DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`nextPayoutDate` timestamp,
	CONSTRAINT `tontineGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tontineMembers` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`joinedAt` timestamp DEFAULT (now()),
	`hasReceivedPayout` boolean NOT NULL DEFAULT false,
	`payoutCycle` int,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `tontineMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);