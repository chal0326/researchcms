
// Payload CMS Schema Definitions for "The Machine" (Seven Mountains Architecture)
// This structure implements the "Seven Mountains Case Files" framework and links to R2 Datamarts.

// ----------------------------------------------------------------------
// 1. MOUNTAINS (Taxonomy)
// ----------------------------------------------------------------------
export const Mountains = {
  slug: 'mountains',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'summary'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true, // e.g., "Government", "Business"
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true, // e.g., "government"
      admin: {
        description: 'URL-friendly identifier',
      },
    },
    {
      name: 'icon',
      type: 'upload', // Requires an 'media' collection to exist, or use 'text' for SVG/Emoji
      relationTo: 'media', 
      required: false,
    },
    {
      name: 'summary',
      type: 'richText',
      label: 'The Thesis',
      admin: {
        description: 'The core argument for how this mountain was captured.',
      },
    },
  ],
};

// ----------------------------------------------------------------------
// 2. ENTITIES (The Data Bridge)
// ----------------------------------------------------------------------
export const Entities = {
  slug: 'entities',
  labels: {
    singular: 'Entity',
    plural: 'Entities',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'ein', 'd1_id'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Organization (Non-Profit/Pol)', value: 'Organization' },
        { label: 'Person', value: 'Person' },
        { label: 'Fund/Trust', value: 'Fund' },
        { label: 'Corporation', value: 'Corporation' },
        { label: 'Government Body', value: 'Government' },
      ],
      required: true,
    },
    {
      name: 'ein',
      label: 'EIN',
      type: 'text',
      index: true,
      admin: {
        description: 'CRITICAL: The Tax ID used to fetch 990 data from R2 Datamarts.',
      },
    },
    {
      name: 'aliases',
      type: 'array',
      fields: [
        {
          name: 'alias',
          type: 'text',
        },
      ],
    },
    {
      name: 'deep_data_pointer',
      label: 'Deep Data Config',
      type: 'json',
      defaultValue: {
        source: 'r2-iceberg',
        bucket: 'giving-tuesday-datamarts',
        path_pattern: '990/{{ein}}/*.parquet',
      },
      admin: {
        description: 'Configuration for fetching external datamart records.',
      },
    },
    {
      name: 'd1_id',
      label: 'D1 Graph ID',
      type: 'text',
      admin: {
        description: 'Legacy ID from the initial graph analysis.',
      },
    },
  ],
};

// ----------------------------------------------------------------------
// 3. EVENT TIMELINE (The Narrative)
// ----------------------------------------------------------------------
export const TimelineEvents = {
  slug: 'timeline-events',
  labels: {
    singular: 'Timeline Event',
    plural: 'Timeline Events',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['year', 'title', 'mountain'],
  },
  fields: [
    {
      name: 'id', // Explicit ID matching the markdown if needed, otherwise Payload auto-generates
      type: 'text', 
      unique: true,
      admin: {
         description: 'Internal ID (e.g. "2024-ziklag-exposed")'
      }
    },
    {
      name: 'year',
      type: 'text', // Keeping as text to handle "2024-05" or just "2024" flexible
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'mountain',
      type: 'relationship',
      relationTo: 'mountains',
      required: true,
      hasMany: false,
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'entities',
      type: 'relationship',
      relationTo: 'entities',
      hasMany: true,
      admin: {
        description: 'Key players involved in this event.',
      },
    },
    {
      name: 'original_text',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Raw markdown for provenance/verification.',
      },
    },
  ],
};

// ----------------------------------------------------------------------
// 4. NARRATIVE CONFIG (Globals)
// ----------------------------------------------------------------------
export const NarrativeConfig = {
  slug: 'narrative-config',
  fields: [
    {
      name: 'prologue',
      type: 'richText',
      label: 'Prologue: The Blueprint',
    },
    {
      name: 'epilogue',
      type: 'richText',
      label: 'Epilogue: The Spoils',
    },
    {
      name: 'authors',
      type: 'text',
    },
    {
      name: 'version',
      type: 'text',
    },
  ],
};
