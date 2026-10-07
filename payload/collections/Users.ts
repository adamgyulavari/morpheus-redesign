import type { CollectionConfig } from 'payload';

import { adminOrSelf, isAdmin, isAdminField } from '../access';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Felhasználó', plural: 'Felhasználók' },
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Beállítások',
    description: 'Az admin felületre belépő munkatársak. Felhasználót csak adminisztrátor kezelhet.',
  },
  defaultSort: 'name',
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      // The very first account (created on the admin's "create first user" screen) is an admin.
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req });
          if (totalDocs === 0) data.role = 'admin';
        }
        return data;
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Név', type: 'text', required: true },
    {
      name: 'role',
      label: 'Szerepkör',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Adminisztrátor', value: 'admin' },
        { label: 'Szerkesztő', value: 'editor' },
      ],
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Szerkesztő: minden tartalmat szerkeszthet, felhasználókat nem. Adminisztrátor: mindent.',
      },
    },
  ],
};
