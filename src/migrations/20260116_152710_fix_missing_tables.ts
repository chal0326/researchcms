import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // await db.run(sql`DROP INDEX \`entities_ledger_source_id_idx\`;`)
  // await db.run(sql`ALTER TABLE \`entities\` ADD \`description\` text;`)
  // await db.run(sql`ALTER TABLE \`entities\` ADD \`source_file\` text;`)
  // await db.run(sql`ALTER TABLE \`entities\` ADD \`metadata\` text;`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`entities_type_idx\` ON \`entities\` (\`type\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`entities_source_file_idx\` ON \`entities\` (\`source_file\`);`,
  )
  // await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`deep_data_pointer\`;`)
  // await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`ledger_source_id\`;`)
  // await db.run(sql`DROP INDEX \`relationships_year_idx\`;`)
  // await db.run(sql`DROP INDEX \`relationships_ledger_source_id_idx\`;`)
  // await db.run(sql`ALTER TABLE \`relationships\` ADD \`attributes\` text;`)
  // await db.run(sql`ALTER TABLE \`relationships\` ADD \`source_file\` text;`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`relationships_source_file_idx\` ON \`relationships\` (\`source_file\`);`,
  )
  // await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`year\`;`)
  // await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`amount\`;`)
  // await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`role\`;`)
  // await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`ledger_source_id\`;`)
  // await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`metadata\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_timeline_events\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` numeric NOT NULL,
  	\`month\` text,
  	\`day\` numeric,
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
  await db.run(
    sql`INSERT INTO \`__new_timeline_events\`("id", "year", "month", "day", "title", "date", "sequence", "is_convergence_point", "body", "original_text", "updated_at", "created_at") SELECT "id", "year", "month", "day", "title", "date", "sequence", "is_convergence_point", "body", "original_text", "updated_at", "created_at" FROM \`timeline_events\`;`,
  )
  await db.run(sql`DROP TABLE \`timeline_events\`;`)
  await db.run(sql`ALTER TABLE \`__new_timeline_events\` RENAME TO \`timeline_events\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`timeline_events_year_idx\` ON \`timeline_events\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_date_idx\` ON \`timeline_events\` (\`date\`);`)
  await db.run(
    sql`CREATE INDEX \`timeline_events_updated_at_idx\` ON \`timeline_events\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`timeline_events_created_at_idx\` ON \`timeline_events\` (\`created_at\`);`,
  )
  // await db.run(sql`ALTER TABLE \`entities_aliases\` ADD \`name\` text;`)
  // await db.run(sql`ALTER TABLE \`entities_aliases\` ADD \`type\` text;`)
  // await db.run(sql`ALTER TABLE \`entities_aliases\` DROP COLUMN \`alias\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`entities_type_idx\`;`)
  await db.run(sql`DROP INDEX \`entities_source_file_idx\`;`)
  await db.run(
    sql`ALTER TABLE \`entities\` ADD \`deep_data_pointer\` text DEFAULT '{"source":"r2-iceberg","bucket":"giving-tuesday-datamarts","path_pattern":"990/{{ein}}/*.parquet"}';`,
  )
  await db.run(sql`ALTER TABLE \`entities\` ADD \`ledger_source_id\` text;`)
  await db.run(
    sql`CREATE INDEX \`entities_ledger_source_id_idx\` ON \`entities\` (\`ledger_source_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`description\`;`)
  await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`source_file\`;`)
  await db.run(sql`ALTER TABLE \`entities\` DROP COLUMN \`metadata\`;`)
  await db.run(sql`DROP INDEX \`relationships_source_file_idx\`;`)
  await db.run(sql`ALTER TABLE \`relationships\` ADD \`year\` numeric;`)
  await db.run(sql`ALTER TABLE \`relationships\` ADD \`amount\` numeric;`)
  await db.run(sql`ALTER TABLE \`relationships\` ADD \`role\` text;`)
  await db.run(sql`ALTER TABLE \`relationships\` ADD \`ledger_source_id\` text;`)
  await db.run(sql`ALTER TABLE \`relationships\` ADD \`metadata\` text;`)
  await db.run(sql`CREATE INDEX \`relationships_year_idx\` ON \`relationships\` (\`year\`);`)
  await db.run(
    sql`CREATE INDEX \`relationships_ledger_source_id_idx\` ON \`relationships\` (\`ledger_source_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`attributes\`;`)
  await db.run(sql`ALTER TABLE \`relationships\` DROP COLUMN \`source_file\`;`)
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
  await db.run(
    sql`INSERT INTO \`__new_timeline_events\`("id", "year", "title", "date", "sequence", "is_convergence_point", "body", "original_text", "updated_at", "created_at") SELECT "id", "year", "title", "date", "sequence", "is_convergence_point", "body", "original_text", "updated_at", "created_at" FROM \`timeline_events\`;`,
  )
  await db.run(sql`DROP TABLE \`timeline_events\`;`)
  await db.run(sql`ALTER TABLE \`__new_timeline_events\` RENAME TO \`timeline_events\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`timeline_events_year_idx\` ON \`timeline_events\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`timeline_events_date_idx\` ON \`timeline_events\` (\`date\`);`)
  await db.run(
    sql`CREATE INDEX \`timeline_events_updated_at_idx\` ON \`timeline_events\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`timeline_events_created_at_idx\` ON \`timeline_events\` (\`created_at\`);`,
  )
  await db.run(sql`ALTER TABLE \`entities_aliases\` ADD \`alias\` text;`)
  await db.run(sql`ALTER TABLE \`entities_aliases\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`entities_aliases\` DROP COLUMN \`type\`;`)
}
