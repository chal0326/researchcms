import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
    \`mountains_id\` integer,
    \`entities_id\` integer,
    \`relationships_id\` integer,
    \`timeline_events_id\` integer,
    \`sources_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`mountains_id\`) REFERENCES \`mountains\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`entities_id\`) REFERENCES \`entities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`relationships_id\`) REFERENCES \`relationships\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`timeline_events_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`sources_id\`) REFERENCES \`sources\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_mountains_id_idx\` ON \`payload_locked_documents_rels\` (\`mountains_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_entities_id_idx\` ON \`payload_locked_documents_rels\` (\`entities_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_relationships_id_idx\` ON \`payload_locked_documents_rels\` (\`relationships_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_timeline_events_id_idx\` ON \`payload_locked_documents_rels\` (\`timeline_events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_sources_id_idx\` ON \`payload_locked_documents_rels\` (\`sources_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
}
