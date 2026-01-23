import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '../access/access'

export const StoryPublications: CollectionConfig = {
  slug: 'story-publications',
  labels: {
    singular: 'Story Publication',
    plural: 'Story Publications',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publicationDate', 'viewCount'],
  },
  access: {
    read: () => true, // Public read access for published stories
    create: authenticated, // Authenticated users can create publications
    update: authenticated, // Authenticated users can update their publications
    delete: adminOnly, // Only admins can delete publications
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Publication Title',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Publication Description',
      required: false,
    },
    {
      name: 'mountains',
      type: 'relationship',
      relationTo: 'mountains',
      hasMany: true,
      required: true,
      label: 'Included Mountains',
    },
    {
      name: 'events',
      type: 'relationship',
      relationTo: 'timeline-events',
      hasMany: true,
      required: true,
      label: 'Included Events',
    },
    {
      name: 'publicationDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        description: 'Date when this story was published',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        description: 'Publication status',
      },
    },
    {
      name: 'exportFormats',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'PDF', value: 'pdf' },
        { label: 'HTML', value: 'html' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'JSON', value: 'json' },
      ],
      admin: {
        description: 'Available export formats',
      },
    },
    {
      name: 'shareUrl',
      type: 'text',
      label: 'Shareable URL',
      admin: {
        readOnly: true,
        description: 'Auto-generated shareable URL',
      },
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of views',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        description: 'User who created this publication',
      },
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'keywords',
          type: 'text',
          hasMany: true,
          label: 'SEO Keywords',
        },
        {
          name: 'coverImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Cover Image',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-generate share URL for published stories
        if (data.status === 'published' && !data.shareUrl) {
          const slug = data.title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
          data.shareUrl = `/stories/${slug}-${Date.now()}`
        }

        // Set createdBy on create
        if (operation === 'create') {
          data.createdBy = req.user?.id
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Update view count tracking
          if (doc.status === 'published') {
            // Could integrate with analytics here
          }
        }
      },
    ],
  },
}
