import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '../access/access'

export const Mountains: CollectionConfig = {
  slug: 'mountains',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order', 'color'],
  },
  access: {
    read: () => true, // Public read access
    create: authenticated, // Authenticated users can create mountains
    update: authenticated, // Authenticated users can update mountains
    delete: adminOnly, // Only admins can delete mountains
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true, // e.g., "Government", "Business"
    },
    {
      name: 'order',
      type: 'number',
      label: 'Presentation Order',
      admin: {
        description: 'Order 1-7 for the reading journey.',
      },
    },
    {
      name: 'introduction',
      type: 'richText',
      label: 'Introduction (POV)',
      admin: {
        description: 'Sets the scene for this specific perspective.',
      },
    },
    {
      name: 'conclusion',
      type: 'richText',
      label: 'Conclusion',
      admin: {
        description: 'Wraps up this narrative thread.',
      },
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
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code for this storyline (e.g. #FF0000)',
      },
    },
  ],
}
