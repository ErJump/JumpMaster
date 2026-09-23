CREATE TABLE `maps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'battle' NOT NULL,
	`image_file` text,
	`image_width` integer DEFAULT 1000 NOT NULL,
	`image_height` integer DEFAULT 1000 NOT NULL,
	`grid_size` integer DEFAULT 70 NOT NULL,
	`grid_offset_x` integer DEFAULT 0 NOT NULL,
	`grid_offset_y` integer DEFAULT 0 NOT NULL,
	`show_grid` integer DEFAULT true NOT NULL,
	`fog` text DEFAULT '[]' NOT NULL,
	`tokens` text DEFAULT '[]' NOT NULL,
	`pins` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_maps_campaign` ON `maps` (`campaign_id`);--> statement-breakpoint
ALTER TABLE `live_state` ADD `map_id` integer;