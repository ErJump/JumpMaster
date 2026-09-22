CREATE TABLE `srd_backgrounds` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `srd_classes` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hit_die` integer NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `srd_conditions` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `srd_equipment` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`subcategory` text,
	`cost_value` integer,
	`cost_unit` text,
	`weight` real,
	`damage` text,
	`properties` text,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_equipment_name` ON `srd_equipment` (`name`);--> statement-breakpoint
CREATE INDEX `idx_equipment_category` ON `srd_equipment` (`category`);--> statement-breakpoint
CREATE TABLE `srd_features` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`class_name` text NOT NULL,
	`level` integer NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_features_class` ON `srd_features` (`class_name`);--> statement-breakpoint
CREATE TABLE `srd_magic_items` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`rarity` text NOT NULL,
	`rarity_rank` integer NOT NULL,
	`description` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_magic_items_name` ON `srd_magic_items` (`name`);--> statement-breakpoint
CREATE INDEX `idx_magic_items_rarity` ON `srd_magic_items` (`rarity_rank`);--> statement-breakpoint
CREATE TABLE `srd_monsters` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`type` text NOT NULL,
	`subtype` text,
	`alignment` text NOT NULL,
	`cr` real NOT NULL,
	`cr_label` text NOT NULL,
	`xp` integer NOT NULL,
	`ac` integer NOT NULL,
	`ac_type` text,
	`hp` integer NOT NULL,
	`hit_dice` text,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_monsters_name` ON `srd_monsters` (`name`);--> statement-breakpoint
CREATE INDEX `idx_monsters_cr` ON `srd_monsters` (`cr`);--> statement-breakpoint
CREATE INDEX `idx_monsters_type` ON `srd_monsters` (`type`);--> statement-breakpoint
CREATE INDEX `idx_monsters_size` ON `srd_monsters` (`size`);--> statement-breakpoint
CREATE TABLE `srd_races` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`speed` integer NOT NULL,
	`size` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `srd_rule_sections` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rules_name` ON `srd_rule_sections` (`name`);--> statement-breakpoint
CREATE TABLE `srd_spells` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`level_label` text NOT NULL,
	`school` text NOT NULL,
	`casting_time` text NOT NULL,
	`range` text NOT NULL,
	`duration` text NOT NULL,
	`concentration` integer NOT NULL,
	`ritual` integer NOT NULL,
	`components` text NOT NULL,
	`classes` text NOT NULL,
	`description` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_spells_name` ON `srd_spells` (`name`);--> statement-breakpoint
CREATE INDEX `idx_spells_level` ON `srd_spells` (`level`);--> statement-breakpoint
CREATE INDEX `idx_spells_school` ON `srd_spells` (`school`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`setting` text DEFAULT '' NOT NULL,
	`dm_notes` text DEFAULT '' NOT NULL,
	`party_level` integer DEFAULT 1 NOT NULL,
	`session_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
