import { Forbidden, type CollectionConfig } from 'payload';

import { anyone, isAdmin, isAdminField, isSelfOrStaff, ROLES, userIsAdmin, userIsStaffOrAdmin } from '../access';
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
    verify: {
      generateEmailSubject: () => verifyEmail.subject,
      generateEmailHTML: ({ token, user }) => verifyEmail.html(token, user),
    },
    forgotPassword: {
      generateEmailSubject: () => resetPassword.subject,
      generateEmailHTML: (args) => resetPassword.html(args?.token ?? '', args?.user),
    },
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Beállítások',
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
          // registration and everyone else's requests make students
          if (totalDocs === 0) data.roles = ['admin'];
          else if (!userIsAdmin(req.user)) data.roles = ['student'];
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
    afterLogin: [({ req }) => setSignedInHint(req, new Date(Date.now() + TOKEN_EXPIRATION * 1000))],
    afterRefresh: [({ req, exp }) => setSignedInHint(req, new Date(exp * 1000))],
    afterLogout: [({ req }) => setSignedInHint(req, new Date(0))],
  },
  fields: [
    {
      type: 'row',
      fields: [text('lastName', 'Vezetéknév', { required: true }), text('firstName', 'Keresztnév', { required: true })],
    },
    text('phone', 'Telefonszám'),
    {
      name: 'name',
      label: 'Név',
      type: 'text',
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'roles',
      label: 'Szerepkörök',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['student'],
      saveToJWT: true,
      options: ROLES,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Hallgató: csak a weboldalon lép be. Munkatárs: tartalmat és csoportokat szerkeszt. Adminisztrátor: mindent, a felhasználókat is.',
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
