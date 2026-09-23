CREATE TABLE `handouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`image_file` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_handouts_campaign` ON `handouts` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `live_state` (
	`campaign_id` integer PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'auto' NOT NULL,
	`handout_id` integer,
	`last_roll` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`handout_id`) REFERENCES `handouts`(`id`) ON UPDATE no action ON DELETE set null
);
