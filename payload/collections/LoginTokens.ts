import type { CollectionConfig } from 'payload';

/**
 * Single-use login links and codes (payload/magic-link.ts). Only hashes are stored.
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
    // HMAC of the 6-digit code; `attempts` counts wrong codes
    { name: 'codeHash', type: 'text' },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'expiresAt', type: 'date', required: true, index: true },
    { name: 'usedAt', type: 'date' },
  ],
};
