/**
 * Whose account a Google login opens: the one linked to that Google account; else the one with its
 * (Google-verified) e-mail address, which gets linked; else a new one (Vendég, like every new
 * account). Logging in with Google also verifies the address and lifts a password lock: the lock
 * is against guessing passwords, and a Google login isn't guessed.
 */
import 'server-only';

import { randomBytes } from 'node:crypto';

import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

import { dbOf } from '@/payload/db';

import type { GoogleIdentity } from './oauth';

const findOne = async (payload: Payload, where: Parameters<Payload['find']>[0]['where']) =>
  (await payload.find({ collection: 'users', where, limit: 1, depth: 0 })).docs[0];

/** The account's id (found, linked or created). */
export async function accountForGoogle(payload: Payload, g: GoogleIdentity): Promise<number> {
  let user =
    (await findOne(payload, { googleSub: { equals: g.sub } })) ??
    (await findOne(payload, { email: { equals: g.email } }));
  if (!user) {
    try {
      user = await payload.create({
        collection: 'users',
        data: {
          email: g.email,
          // they log in with Google (or links); "Elfelejtett jelszó" gives them one of their own
          password: randomBytes(24).toString('base64url'),
          lastName: g.lastName,
          firstName: g.firstName,
          googleSub: g.sub,
          roles: ['guest'],
          _verified: true,
        },
        disableVerificationEmail: true,
      });
    } catch (err) {
      // the same address at once from another request: that one made the account
      user = await findOne(payload, { email: { equals: g.email } });
      if (!user) throw err;
    }
  }
  await (await dbOf(payload)).execute(sql`
    UPDATE users SET google_sub = ${g.sub}, _verified = true, login_attempts = 0, lock_until = NULL
    WHERE id = ${user.id}`);
  return user.id;
}
