import type { CollectionConfig } from 'payload';

/**
 * Single-use login links (payload/magic-link.ts). Only the SHA-256 hash of a token is stored.
 * Not in the admin and not readable through the API; only server code (Local API) uses it.
 */
const nobody = () => false;

export const LoginTokens: CollectionConfig = {
  slug: 'loginTokens',
  labels: { singular: 'Belépési link', plural: 'Belépési linkek' },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  admin: { hidden: true },
  fields: [
    // not required: deleting the user empties it (ON DELETE SET NULL); such a token never logs in
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'tokenHash', type: 'text', required: true, unique: true, index: true },
    { name: 'expiresAt', type: 'date', required: true, index: true },
    { name: 'usedAt', type: 'date' },
  ],
};
