import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '../access/access'

export const Sources: CollectionConfig = {
  slug: 'sources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'author', 'publication_date'],
  },
  access: {
    read: () => true, // Public read access
    create: authenticated, // Authenticated users can create sources
    update: authenticated, // Authenticated users can update sources
    delete: adminOnly, // Only admins can delete sources
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: 'Title / Headline',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Book', value: 'Book' },
        { label: 'Academic Paper', value: 'Academic Paper' },
        { label: 'News Article (URL)', value: 'URL' },
        { label: 'Court Document', value: 'Court Document' },
        { label: 'Media File', value: 'Media File' },
        { label: 'Interview', value: 'Interview' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'author',
      type: 'text',
      label: 'Author / Creator / Org',
      index: true,
    },
    {
      name: 'publication_date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL (if applicable)',
      admin: {
        condition: (data) => data.type === 'URL' || data.type === 'Other',
      },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Source File (PDF/Image)',
      admin: {
        condition: (data) =>
          data.type === 'Media File' ||
          data.type === 'Court Document' ||
          data.type === 'Academic Paper' ||
          data.type === 'Book',
      },
    },
    {
      name: 'citation_text',
      type: 'textarea',
      label: 'Full Citation (APA/MLA)',
      admin: {
        description: 'Formatted citation string for display purposes.',
      },
    },
  ],
}
