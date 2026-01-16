import type { CollectionConfig } from 'payload'
import { authenticated, anyone } from '../access/access'

export const Relationships: CollectionConfig = {
  slug: 'relationships',
  labels: {
    singular: 'Relationship',
    plural: 'Relationships',
  },
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['from', 'to', 'type', 'source_file'],
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'from',
      type: 'relationship',
      relationTo: 'entities',
      required: true,
      index: true,
    },
    {
      name: 'to',
      type: 'relationship',
      relationTo: 'entities',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'CAUSED_BY / TRIGGERED', value: 'TRIGGERED' },
        { label: 'PARTICIPATED_IN', value: 'PARTICIPATED_IN' },
        { label: 'AFFECTED', value: 'AFFECTED' },
        { label: 'LOCATED_IN', value: 'LOCATED_IN' },
        { label: 'PRECEDES', value: 'PRECEDES' },
        { label: 'FOLLOWS', value: 'FOLLOWS' },
        { label: 'ASSOCIATED_WITH', value: 'ASSOCIATED_WITH' },
        { label: 'MENTIONS', value: 'MENTIONS' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'attributes',
      type: 'json',
      admin: {
        description: 'Structured attributes like Role, Severity, Type, etc.',
      },
    },
    {
      name: 'source_file',
      type: 'text',
      index: true,
    },
  ],
}
