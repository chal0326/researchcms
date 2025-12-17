import type { CollectionConfig } from 'payload'

export const Entities: CollectionConfig = {
  slug: 'entities',
  labels: {
    singular: 'Entity',
    plural: 'Entities',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'ein', 'd1_id'],
  },
  access: {
    read: () => true,
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
}
