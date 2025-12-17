import type { CollectionConfig } from 'payload'

export const TimelineEvents: CollectionConfig = {
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
        description: 'Internal ID (e.g. "2024-ziklag-exposed")',
      },
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
}
