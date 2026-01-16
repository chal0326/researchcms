import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '../access/access'

export const TimelineEvents: CollectionConfig = {
  slug: 'timeline-events',
  labels: {
    singular: 'Timeline Event',
    plural: 'Timeline Events',
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Construct sortable date from parts
        if (data.year) {
          const year = parseInt(data.year)
          const month = data.month ? parseInt(data.month) - 1 : 0 // Default to Jan
          const day = data.day ? parseInt(data.day) : 1 // Default to 1st

          // Create date object (UTC to avoid timezone shifts affecting the date)
          const date = new Date(Date.UTC(year, month, day))
          data.date = date.toISOString()
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['year', 'month', 'title', 'mountains'],
  },
  access: {
    read: () => true, // Public read access
    create: authenticated, // Authenticated users can create events
    update: authenticated, // Authenticated users can update events
    delete: adminOnly, // Only admins can delete events
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
      type: 'row',
      fields: [
        {
          name: 'year',
          type: 'number',
          required: true,
          index: true,
          admin: {
            width: '33%',
            description: 'YYYY (Mandatory)',
          },
        },
        {
          name: 'month',
          type: 'select',
          required: false,
          admin: {
            width: '33%',
            description: 'Month (Optional)',
          },
          options: [
            { label: 'January', value: '1' },
            { label: 'February', value: '2' },
            { label: 'March', value: '3' },
            { label: 'April', value: '4' },
            { label: 'May', value: '5' },
            { label: 'June', value: '6' },
            { label: 'July', value: '7' },
            { label: 'August', value: '8' },
            { label: 'September', value: '9' },
            { label: 'October', value: '10' },
            { label: 'November', value: '11' },
            { label: 'December', value: '12' },
          ],
        },
        {
          name: 'day',
          type: 'number',
          required: false,
          min: 1,
          max: 31,
          admin: {
            width: '33%',
            description: 'Day (Optional)',
          },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        readOnly: true,
        hidden: true, // Hide from manual entry, used for sorting
        description: 'Auto-calculated for sorting.',
      },
      index: true,
    },
    {
      name: 'sequence',
      type: 'number',
      admin: {
        description: 'Order of events within the same day (1, 2, 3...).',
      },
    },
    {
      name: 'mountains',
      type: 'relationship',
      relationTo: 'mountains',
      required: true,
      hasMany: true, // Allow an event to belong to multiple storylines
      index: true,
    },
    {
      name: 'isConvergencePoint',
      type: 'checkbox',
      label: 'Is Convergence Point?',
      defaultValue: false,
      admin: {
        description: 'Check this if this event signifies a major crossover between storylines.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'sources',
      type: 'array',
      labels: {
        singular: 'Source Citation',
        plural: 'Source Citations',
      },
      fields: [
        {
          name: 'source',
          type: 'relationship',
          relationTo: 'sources',
          required: true,
        },
        {
          name: 'reference_location',
          type: 'text',
          label: 'Location',
          required: true,
          admin: {
            description: 'Page number, timestamp, or paragraph (e.g., "Page 42, para 3").',
          },
        },
        {
          name: 'quote',
          type: 'textarea',
          label: 'Direct Quote / Excerpt',
          required: false,
        },
      ],
      admin: {
        description: 'Evidence backing this event.',
      },
    },
    {
      name: 'entities',
      type: 'array',
      labels: {
        singular: 'Involved Entity',
        plural: 'Involved Entities',
      },
      fields: [
        {
          name: 'entity',
          type: 'relationship',
          relationTo: 'entities',
          required: true,
        },
        {
          name: 'context',
          type: 'textarea',
          label: 'Contextual Role/Detail',
          required: false,
          admin: {
            description: 'E.g. "Payer of $5k", "Hired as CEO", "Victim". Optional nuance.',
          },
        },
      ],
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
