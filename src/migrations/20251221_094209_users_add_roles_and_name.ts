import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_roles\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_roles_order_idx\` ON \`users_roles\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`users_roles_parent_idx\` ON \`users_roles\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`relationships\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`from_id\` integer NOT NULL,
  	\`to_id\` integer NOT NULL,
  	\`type\` text NOT NULL,
  	\`year\` numeric,
  	\`amount\` numeric,
  	\`description\` text,
  	\`role\` text,
  	\`ledger_source_id\` text,
  	\`metadata\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`from_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`to_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`relationships_from_idx\` ON \`relationships\` (\`from_id\`);`)
  await db.run(sql`CREATE INDEX \`relationships_to_idx\` ON \`relationships\` (\`to_id\`);`)
  await db.run(sql`CREATE INDEX \`relationships_type_idx\` ON \`relationships\` (\`type\`);`)
  await db.run(sql`CREATE INDEX \`relationships_year_idx\` ON \`relationships\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`relationships_ledger_source_id_idx\` ON \`relationships\` (\`ledger_source_id\`);`)
  await db.run(sql`CREATE INDEX \`relationships_updated_at_idx\` ON \`relationships\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`relationships_created_at_idx\` ON \`relationships\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`timeline_events_sources\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`source_id\` integer NOT NULL,
  	\`reference_location\` text NOT NULL,
  	\`quote\` text,
  	FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`timeline_events_sources_order_idx\` ON \`timeline_events_sources\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_sources_parent_id_idx\` ON \`timeline_events_sources\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_sources_source_idx\` ON \`timeline_events_sources\` (\`source_id\`);`)
  await db.run(sql`CREATE TABLE \`timeline_events_entities\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`entity_id\` integer NOT NULL,
  	\`context\` text,
  	FOREIGN KEY (\`entity_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`timeline_events_entities_order_idx\` ON \`timeline_events_entities\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_entities_parent_id_idx\` ON \`timeline_events_entities\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_entities_entity_idx\` ON \`timeline_events_entities\` (\`entity_id\`);`)
  await db.run(sql`CREATE TABLE \`sources\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`type\` text NOT NULL,
  	\`author\` text,
  	\`publication_date\` text,
  	\`url\` text,
  	\`file_id\` integer,
  	\`citation_text\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`sources_title_idx\` ON \`sources\` (\`title\`);`)
  await db.run(sql`CREATE INDEX \`sources_author_idx\` ON \`sources\` (\`author\`);`)
  await db.run(sql`CREATE INDEX \`sources_file_idx\` ON \`sources\` (\`file_id\`);`)
  await db.run(sql`CREATE INDEX \`sources_updated_at_idx\` ON \`sources\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`sources_created_at_idx\` ON \`sources\` (\`created_at\`);`)
  await db.run(sql`DROP TABLE \`payload_mcp_api_keys\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_timeline_events\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`date\` text NOT NULL,
  	\`sequence\` numeric,
  	\`is_convergence_point\` integer DEFAULT false,
  	\`body\` text NOT NULL,
  	\`original_text\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_timeline_events\`("id", "year", "title", "date", "sequence", "is_convergence_point", "body", "original_text", "updated_at", "created_at") SELECT "id", "year", "title", "date", "sequence", "is_convergence_point", "body", "original_text", "updated_at", "created_at" FROM \`timeline_events\`;`)
  await db.run(sql`DROP TABLE \`timeline_events\`;`)
  await db.run(sql`ALTER TABLE \`__new_timeline_events\` RENAME TO \`timeline_events\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`timeline_events_year_idx\` ON \`timeline_events\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_date_idx\` ON \`timeline_events\` (\`date\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_updated_at_idx\` ON \`timeline_events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_created_at_idx\` ON \`timeline_events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_timeline_events_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text NOT NULL,
  	\`path\` text NOT NULL,
  	\`mountains_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`mountains_id\`) REFERENCES \`mountains\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_timeline_events_rels\`("id", "order", "parent_id", "path", "mountains_id") SELECT "id", "order", "parent_id", "path", "mountains_id" FROM \`timeline_events_rels\`;`)
  await db.run(sql`DROP TABLE \`timeline_events_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_timeline_events_rels\` RENAME TO \`timeline_events_rels\`;`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_order_idx\` ON \`timeline_events_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_parent_idx\` ON \`timeline_events_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_path_idx\` ON \`timeline_events_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_mountains_id_idx\` ON \`timeline_events_rels\` (\`mountains_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`mountains_id\` integer,
  	\`entities_id\` integer,
  	\`relationships_id\` integer,
  	\`timeline_events_id\` text,
  	\`sources_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`mountains_id\`) REFERENCES \`mountains\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`entities_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`relationships_id\`) REFERENCES \`relationships\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`timeline_events_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sources_id\`) REFERENCES \`sources\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "mountains_id", "entities_id", "relationships_id", "timeline_events_id", "sources_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "mountains_id", "entities_id", "relationships_id", "timeline_events_id", "sources_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_mountains_id_idx\` ON \`payload_locked_documents_rels\` (\`mountains_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_entities_id_idx\` ON \`payload_locked_documents_rels\` (\`entities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_relationships_id_idx\` ON \`payload_locked_documents_rels\` (\`relationships_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_timeline_events_id_idx\` ON \`payload_locked_documents_rels\` (\`timeline_events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_sources_id_idx\` ON \`payload_locked_documents_rels\` (\`sources_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_preferences_rels\`("id", "order", "parent_id", "path", "users_id") SELECT "id", "order", "parent_id", "path", "users_id" FROM \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_preferences_rels\` RENAME TO \`payload_preferences_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`name\` text;`)
  await db.run(sql`ALTER TABLE \`mountains\` ADD \`order\` numeric;`)
  await db.run(sql`ALTER TABLE \`mountains\` ADD \`introduction\` text;`)
  await db.run(sql`ALTER TABLE \`mountains\` ADD \`conclusion\` text;`)
  await db.run(sql`ALTER TABLE \`mountains\` ADD \`color\` text;`)
  await db.run(sql`ALTER TABLE \`entities\` ADD \`ledger_source_id\` text;`)
  await db.run(sql`CREATE INDEX \`entities_ledger_source_id_idx\` ON \`entities\` (\`ledger_source_id\`);`)
  await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`d1_id\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`payload_mcp_api_keys\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`label\` text,
  	\`description\` text,
  	\`mountains_find\` integer DEFAULT false,
  	\`mountains_create\` integer DEFAULT false,
  	\`mountains_update\` integer DEFAULT false,
  	\`mountains_delete\` integer DEFAULT false,
  	\`entities_find\` integer DEFAULT false,
  	\`entities_create\` integer DEFAULT false,
  	\`entities_update\` integer DEFAULT false,
  	\`entities_delete\` integer DEFAULT false,
  	\`timeline_events_find\` integer DEFAULT false,
  	\`timeline_events_create\` integer DEFAULT false,
  	\`timeline_events_update\` integer DEFAULT false,
  	\`timeline_events_delete\` integer DEFAULT false,
  	\`users_find\` integer DEFAULT false,
  	\`users_create\` integer DEFAULT false,
  	\`users_update\` integer DEFAULT false,
  	\`users_delete\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`enable_a_p_i_key\` integer,
  	\`api_key\` text,
  	\`api_key_index\` text,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_mcp_api_keys_user_idx\` ON \`payload_mcp_api_keys\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_mcp_api_keys_updated_at_idx\` ON \`payload_mcp_api_keys\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_mcp_api_keys_created_at_idx\` ON \`payload_mcp_api_keys\` (\`created_at\`);`)
  await db.run(sql`DROP TABLE \`users_roles\`;`)
  await db.run(sql`DROP TABLE \`relationships\`;`)
  await db.run(sql`DROP TABLE \`timeline_events_sources\`;`)
  await db.run(sql`DROP TABLE \`timeline_events_entities\`;`)
  await db.run(sql`DROP TABLE \`sources\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_timeline_events_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text NOT NULL,
  	\`path\` text NOT NULL,
  	\`entities_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`entities_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_timeline_events_rels\`("id", "order", "parent_id", "path", "entities_id") SELECT "id", "order", "parent_id", "path", "entities_id" FROM \`timeline_events_rels\`;`)
  await db.run(sql`DROP TABLE \`timeline_events_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_timeline_events_rels\` RENAME TO \`timeline_events_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_order_idx\` ON \`timeline_events_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_parent_idx\` ON \`timeline_events_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_path_idx\` ON \`timeline_events_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_entities_id_idx\` ON \`timeline_events_rels\` (\`entities_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`mountains_id\` integer,
  	\`entities_id\` integer,
  	\`timeline_events_id\` text,
  	\`payload_mcp_api_keys_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`mountains_id\`) REFERENCES \`mountains\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`entities_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`timeline_events_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_mcp_api_keys_id\`) REFERENCES \`payload_mcp_api_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "mountains_id", "entities_id", "timeline_events_id", "payload_mcp_api_keys_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "mountains_id", "entities_id", "timeline_events_id", "payload_mcp_api_keys_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_mountains_id_idx\` ON \`payload_locked_documents_rels\` (\`mountains_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_entities_id_idx\` ON \`payload_locked_documents_rels\` (\`entities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_timeline_events_id_idx\` ON \`payload_locked_documents_rels\` (\`timeline_events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_payload_mcp_api_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_mcp_api_keys_id\`);`)
  await db.run(sql`DROP INDEX \`entities_ledger_source_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`entities\` ADD \`d1_id\` text;`)
  await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`ledger_source_id\`;`)
  await db.run(sql`DROP INDEX \`timeline_events_date_idx\`;`)
  await db.run(sql`ALTER TABLE \`timeline_events\` ADD \`mountain_id\` integer NOT NULL REFERENCES mountains(id);`)
  await db.run(sql`CREATE INDEX \`timeline_events_mountain_idx\` ON \`timeline_events\` (\`mountain_id\`);`)
  await db.run(sql`ALTER TABLE \`timeline_events\` DROP COLUMN \`date\`;`)
  await db.run(sql`ALTER TABLE \`timeline_events\` DROP COLUMN \`sequence\`;`)
  await db.run(sql`ALTER TABLE \`timeline_events\` DROP COLUMN \`is_convergence_point\`;`)
  await db.run(sql`ALTER TABLE \`payload_preferences_rels\` ADD \`payload_mcp_api_keys_id\` integer REFERENCES payload_mcp_api_keys(id);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_payload_mcp_api_keys_id_idx\` ON \`payload_preferences_rels\` (\`payload_mcp_api_keys_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`mountains\` DROP COLUMN \`order\`;`)
  await db.run(sql`ALTER TABLE \`mountains\` DROP COLUMN \`introduction\`;`)
  await db.run(sql`ALTER TABLE \`mountains\` DROP COLUMN \`conclusion\`;`)
  await db.run(sql`ALTER TABLE \`mountains\` DROP COLUMN \`color\`;`)
}
