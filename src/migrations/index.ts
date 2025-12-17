import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20251216_235015_add_research_schema from './20251216_235015_add_research_schema';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20251216_235015_add_research_schema.up,
    down: migration_20251216_235015_add_research_schema.down,
    name: '20251216_235015_add_research_schema'
  },
];
