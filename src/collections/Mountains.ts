import type { CollectionConfig } from 'payload'

export const Mountains: CollectionConfig = {
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
}
