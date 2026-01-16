import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '../access/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true, // Public read access
    create: authenticated, // Authenticated users can upload media
    update: authenticated, // Authenticated users can update media
    delete: adminOnly, // Only admins can delete media
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
