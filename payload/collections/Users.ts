import { type CollectionConfig, Forbidden } from 'payload';

import {
  anyone,
  isAdmin,
  isAdminField,
  isSelfOrStaff,
  isStaffOrAdminField,
  ROLES,
  userIsAdmin,
  userIsStaffOrAdmin,
} from '../access';
import { resetPassword, verifyEmail } from '../email';
import { text } from '../fields';
import { magicLinkEndpoint } from '../magic-link';
import { setSignedInHint } from '../session';

const TOKEN_EXPIRATION = 7200; // seconds (Payload's default), also the hint cookie's lifetime

/**
 * Everyone who logs in: staff in /admin, students on the public site (/belepes, /fiokom). One
 * account can have several roles (see payload/access.ts). Registration is public and always makes
 * a student; only an admin gives other roles.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Felhasználó', plural: 'Felhasználók' },
  auth: {
    tokenExpiration: TOKEN_EXPIRATION,
    // the texts: Beállítások → E-mailek (payload/email-texts.ts)
    verify: {
      generateEmailSubject: async ({ req, token, user }) => (await verifyEmail(req.payload, token, user)).subject,
      generateEmailHTML: async ({ req, token, user }) => (await verifyEmail(req.payload, token, user)).html,
    },
    forgotPassword: {
      generateEmailSubject: async (args) =>
        args?.req ? (await resetPassword(args.req.payload, args.token ?? '', args.user)).subject : 'Új jelszó',
      generateEmailHTML: async (args) =>
        args?.req ? (await resetPassword(args.req.payload, args.token ?? '', args.user)).html : '',
    },
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    description: 'Munkatársak (admin felület) és hallgatók (a weboldal fiókja). Szerepkört csak adminisztrátor adhat.',
  },
  defaultSort: 'name',
  access: {
    // students never get into /admin, even with a valid login
    admin: ({ req: { user } }) => userIsStaffOrAdmin(user),
    read: isSelfOrStaff,
    create: anyone,
    update: isSelfOrStaff,
    delete: isAdmin,
  },
  endpoints: [magicLinkEndpoint],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req });
          // the very first account (the admin's "create first user" screen) is an admin;
          // registration and everyone else's requests make guests (a course group makes students)
          if (totalDocs === 0) data.roles = ['admin'];
          else if (!userIsAdmin(req.user)) data.roles = ['guest'];
          // a request from outside can't create a pre-verified account (server code can)
          if (!userIsAdmin(req.user) && req.payloadAPI !== 'local') delete data._verified;
        }
        // staff manage students, but only an admin may change another admin's account
        if (operation === 'update' && originalDoc && req.user && !userIsAdmin(req.user)) {
          if (userIsAdmin(originalDoc) && originalDoc.id !== req.user.id) throw new Forbidden(req.t);
        }
        const firstName = data.firstName ?? originalDoc?.firstName;
        const lastName = data.lastName ?? originalDoc?.lastName;
        // Hungarian order: family name first
        if (firstName || lastName) data.name = [lastName, firstName].filter(Boolean).join(' ');
        return data;
      },
    ],
    // a cookie that only tells the cached public pages "show Fiókom" (see payload/session.ts)
    afterLogin: [({ req, user }) => setSignedInHint(req, new Date(Date.now() + TOKEN_EXPIRATION * 1000), user)],
    afterRefresh: [({ req, exp }) => setSignedInHint(req, new Date(exp * 1000), req.user)],
    afterLogout: [({ req }) => setSignedInHint(req, new Date(0))],
  },
  fields: [
    {
      type: 'row',
      fields: [text('lastName', 'Vezetéknév', { required: true }), text('firstName', 'Keresztnév', { required: true })],
    },
    text('phone', 'Telefonszám'),
    {
      // the buyer on invoices; prefilled at checkout (/fizetes), editable in /fiokom/adatok
      name: 'billing',
      label: 'Számlázási adatok',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            text('name', 'Számlázási név', { description: 'Üresen: a saját neve.' }),
            text('taxNumber', 'Adószám', { description: 'Csak cégnek.' }),
          ],
        },
        {
          type: 'row',
          fields: [
            text('zip', 'Irányítószám'),
            text('city', 'Város'),
            {
              name: 'country',
              label: 'Ország',
              type: 'text',
              defaultValue: 'HU',
              admin: { description: 'Kétbetűs kód.' },
            },
          ],
        },
        text('address', 'Cím (utca, házszám)'),
      ],
    },
    {
      name: 'name',
      label: 'Név',
      type: 'text',
      admin: { readOnly: true, hidden: true },
    },
    {
      // the only way to room booking (lib/rooms/rules.ts)
      name: 'roomBooking',
      label: 'Teremfoglalás engedélyezve',
      type: 'checkbox',
      defaultValue: false,
      access: { create: isStaffOrAdminField, update: isStaffOrAdminField },
      admin: {
        position: 'sidebar',
        description:
          'Foglalhat termet gyakorláshoz a Fiókom → Teremfoglalás oldalon. Csak ezzel lehet foglalni; a kurzus-tagság önmagában nem ad jogot.',
      },
    },
    {
      name: 'roles',
      label: 'Szerepkörök',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['guest'],
      saveToJWT: true,
      options: ROLES,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description:
          'Vendég: csak a weboldalon lép be (jelentkezett vagy jegyet foglalt). Hallgató: egy csoportunk tagja — automatikus, amikor csoportba kerül. Munkatárs: tartalmat és csoportokat szerkeszt. Adminisztrátor: mindent, a felhasználókat is.',
      },
    },
    {
      name: 'courseGroups',
      label: 'Csoportjai',
      type: 'join',
      collection: 'courseGroups',
      on: 'students',
      admin: { defaultColumns: ['title', 'startDate', 'endDate'] },
    },
  ],
};
