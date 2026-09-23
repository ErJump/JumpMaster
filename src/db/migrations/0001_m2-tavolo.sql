CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`player_name` text DEFAULT '' NOT NULL,
	`class_name` text DEFAULT '' NOT NULL,
	`subclass` text DEFAULT '' NOT NULL,
	`race` text DEFAULT '' NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`ac` integer DEFAULT 10 NOT NULL,
	`max_hp` integer DEFAULT 1 NOT NULL,
	`speed` integer DEFAULT 30 NOT NULL,
	`str` integer DEFAULT 10 NOT NULL,
	`dex` integer DEFAULT 10 NOT NULL,
	`con` integer DEFAULT 10 NOT NULL,
	`int` integer DEFAULT 10 NOT NULL,
	`wis` integer DEFAULT 10 NOT NULL,
	`cha` integer DEFAULT 10 NOT NULL,
	`save_proficiencies` text DEFAULT '[]' NOT NULL,
	`skill_proficiencies` text DEFAULT '[]' NOT NULL,
	`skill_expertise` text DEFAULT '[]' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`disposition` text DEFAULT 'unknown' NOT NULL,
	`appearance` text DEFAULT '' NOT NULL,
	`voice` text DEFAULT '' NOT NULL,
	`secret` text DEFAULT '' NOT NULL,
	`srd_monster_slug` text,
	`notes` text DEFAULT '' NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_characters_campaign` ON `characters` (`campaign_id`,`kind`);--> statement-breakpoint
CREATE TABLE `combat_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`encounter_id` integer NOT NULL,
	`seq` integer NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`undone_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_combat_events_encounter` ON `combat_events` (`encounter_id`,`seq`);--> statement-breakpoint
CREATE TABLE `encounter_monsters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`encounter_id` integer NOT NULL,
	`srd_monster_slug` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`cr` text NOT NULL,
	`xp` integer NOT NULL,
	`hp` integer DEFAULT 1 NOT NULL,
	`ac` integer DEFAULT 10 NOT NULL,
	`initiative_mod` integer DEFAULT 0 NOT NULL,
	`hit_dice` text,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_encounter_monsters_encounter` ON `encounter_monsters` (`encounter_id`);--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_encounters_campaign` ON `encounters` (`campaign_id`);