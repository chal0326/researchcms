import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_timeline_events\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`date\` text,
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
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
}
