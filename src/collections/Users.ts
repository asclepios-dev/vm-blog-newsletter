import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'email'],
  },
  auth: true,
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      admin: {
        description: 'Your display name',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture',
        components: {
          Field: '@/components/admin/avatar-cropper#AvatarCropper',
        },
      },
    },
  ],
}
