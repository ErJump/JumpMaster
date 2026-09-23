CREATE TABLE `open5e_documents` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`publisher` text NOT NULL,
	`permalink` text,
	`licenses` text DEFAULT '[]' NOT NULL,
	`monster_count` integer DEFAULT 0 NOT NULL,
	`imported_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `open5e_licenses` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `open5e_monsters` (
	`slug` text PRIMARY KEY NOT NULL,
	`document_key` text NOT NULL,
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
	`data` text NOT NULL,
	FOREIGN KEY (`document_key`) REFERENCES `open5e_documents`(`key`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_open5e_monsters_document` ON `open5e_monsters` (`document_key`);--> statement-breakpoint
CREATE INDEX `idx_open5e_monsters_name` ON `open5e_monsters` (`name`);--> statement-breakpoint
CREATE VIEW `monsters` AS SELECT slug, name, size, type, subtype, alignment, cr, cr_label, xp, ac, ac_type, hp, hit_dice, data, 'srd' AS source FROM srd_monsters
      UNION ALL
      SELECT slug, name, size, type, subtype, alignment, cr, cr_label, xp, ac, ac_type, hp, hit_dice, data, document_key AS source FROM open5e_monsters;