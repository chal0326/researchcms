import type { CollectionConfig } from 'payload'
import { adminOnly, adminOrSelf } from '../access/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: () => true, // Allow anyone to create an account (first signup)
    read: adminOrSelf, // Users can read their own profile, admins can read all
    update: adminOrSelf, // Users can update their own profile, admins can update all
    delete: adminOnly, // Only admins can delete users
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false,
      admin: {
        description: 'Display name for this user',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true, // Include in JWT for fast access checks
      access: {
        create: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
        update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      },
      admin: {
        description: 'User roles for access control',
      },
    },
  ],
}
