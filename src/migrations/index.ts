import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20251216_235015_add_research_schema from './20251216_235015_add_research_schema';
import * as migration_20251218_004828_fix_schema_drift from './20251218_004828_fix_schema_drift';
import * as migration_20251221_094209_users_add_roles_and_name from './20251221_094209_users_add_roles_and_name';
import * as migration_20251221_131338_date_field_optional from './20251221_131338_date_field_optional';
import * as migration_20260116_152710_fix_missing_tables from './20260116_152710_fix_missing_tables';
import * as migration_20260116_154447_fix_locked_documents from './20260116_154447_fix_locked_documents';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20251216_235015_add_research_schema.up,
    down: migration_20251216_235015_add_research_schema.down,
    name: '20251216_235015_add_research_schema',
  },
  {
    up: migration_20251218_004828_fix_schema_drift.up,
    down: migration_20251218_004828_fix_schema_drift.down,
    name: '20251218_004828_fix_schema_drift',
  },
  {
    up: migration_20251221_094209_users_add_roles_and_name.up,
    down: migration_20251221_094209_users_add_roles_and_name.down,
    name: '20251221_094209_users_add_roles_and_name',
  },
  {
    up: migration_20251221_131338_date_field_optional.up,
    down: migration_20251221_131338_date_field_optional.down,
    name: '20251221_131338_date_field_optional',
  },
  {
    up: migration_20260116_152710_fix_missing_tables.up,
    down: migration_20260116_152710_fix_missing_tables.down,
    name: '20260116_152710_fix_missing_tables',
  },
  {
    up: migration_20260116_154447_fix_locked_documents.up,
    down: migration_20260116_154447_fix_locked_documents.down,
    name: '20260116_154447_fix_locked_documents'
  },
];
