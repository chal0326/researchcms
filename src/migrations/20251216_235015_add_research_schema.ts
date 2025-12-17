import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`mountains\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`icon_id\` integer,
  	\`summary\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`mountains_title_idx\` ON \`mountains\` (\`title\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`mountains_slug_idx\` ON \`mountains\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`mountains_icon_idx\` ON \`mountains\` (\`icon_id\`);`)
  await db.run(sql`CREATE INDEX \`mountains_updated_at_idx\` ON \`mountains\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`mountains_created_at_idx\` ON \`mountains\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`entities_aliases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`alias\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`entities_aliases_order_idx\` ON \`entities_aliases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`entities_aliases_parent_id_idx\` ON \`entities_aliases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`entities\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`type\` text NOT NULL,
  	\`ein\` text,
  	\`deep_data_pointer\` text DEFAULT '{"source":"r2-iceberg","bucket":"giving-tuesday-datamarts","path_pattern":"990/{{ein}}/*.parquet"}',
  	\`d1_id\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`entities_name_idx\` ON \`entities\` (\`name\`);`)
  await db.run(sql`CREATE INDEX \`entities_ein_idx\` ON \`entities\` (\`ein\`);`)
  await db.run(sql`CREATE INDEX \`entities_updated_at_idx\` ON \`entities\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`entities_created_at_idx\` ON \`entities\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`timeline_events\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`mountain_id\` integer NOT NULL,
  	\`body\` text NOT NULL,
  	\`original_text\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`mountain_id\`) REFERENCES \`mountains\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`timeline_events_year_idx\` ON \`timeline_events\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_mountain_idx\` ON \`timeline_events\` (\`mountain_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_updated_at_idx\` ON \`timeline_events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_created_at_idx\` ON \`timeline_events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`timeline_events_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text NOT NULL,
  	\`path\` text NOT NULL,
  	\`entities_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`entities_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_order_idx\` ON \`timeline_events_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_parent_idx\` ON \`timeline_events_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_path_idx\` ON \`timeline_events_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_rels_entities_id_idx\` ON \`timeline_events_rels\` (\`entities_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`narrative_config\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`prologue\` text,
  	\`epilogue\` text,
  	\`authors\` text,
  	\`version\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`mountains_id\` integer REFERENCES mountains(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`entities_id\` integer REFERENCES entities(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`timeline_events_id\` text REFERENCES timeline_events(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_mountains_id_idx\` ON \`payload_locked_documents_rels\` (\`mountains_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_entities_id_idx\` ON \`payload_locked_documents_rels\` (\`entities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_timeline_events_id_idx\` ON \`payload_locked_documents_rels\` (\`timeline_events_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`mountains\`;`)
  await db.run(sql`DROP TABLE \`entities_aliases\`;`)
  await db.run(sql`DROP TABLE \`entities\`;`)
  await db.run(sql`DROP TABLE \`timeline_events\`;`)
  await db.run(sql`DROP TABLE \`timeline_events_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`narrative_config\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
}
