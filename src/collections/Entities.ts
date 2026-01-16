import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '../access/access'

export const Entities: CollectionConfig = {
  slug: 'entities',
  labels: {
    singular: 'Entity',
    plural: 'Entities',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'ein', 'source_file'],
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: adminOnly,
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
        { label: 'Person', value: 'Person' },
        { label: 'Organization', value: 'Organization' },
        { label: 'Event', value: 'Event' },
        { label: 'Actor', value: 'Actor' },
        { label: 'Polity', value: 'Polity' },
        { label: 'Concept/Ideology', value: 'Concept' },
        { label: 'Location', value: 'Location' },
        { label: 'Impact/Outcome', value: 'Impact' },
        { label: 'Topic', value: 'Topic' },
        { label: 'System', value: 'System' },
        { label: 'Other', value: 'Other' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'ein',
      label: 'EIN',
      type: 'text',
      index: true,
      validate: (val: string | null) => {
        if (!val) return true
        return /^\d{9}$/.test(val) || 'EIN must be exactly 9 digits (0-9).'
      },
      admin: {
        description:
          'Employer Identification Number (for Organizations). Must be exactly 9 digits.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'aliases',
      label: 'Known Aliases (DBA, AKA, Former Names)',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'AKA (Also Known As)', value: 'AKA' },
            { label: 'DBA (Doing Business As)', value: 'DBA' },
            { label: 'Former Name', value: 'FormerName' },
            { label: 'Umbrella / Parent Org', value: 'Parent' },
            { label: 'Subsidiary', value: 'Subsidiary' },
            { label: 'Conglomerate', value: 'Conglomerate' },
          ],
        },
      ],
    },
    {
      name: 'source_file',
      type: 'text',
      index: true,
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
