import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20251216_235015_add_research_schema from './20251216_235015_add_research_schema';
import * as migration_20251218_004828_fix_schema_drift from './20251218_004828_fix_schema_drift';

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
    name: '20251218_004828_fix_schema_drift'
  },
];
