/**
 * Sessions outside Payload's own login endpoint (the magic link). They are the same as an admin
 * login: a session on the user (`useSessions`), a signed JWT and the HTTP-only `payload-token`
 * cookie — built with Payload's exported helpers, the way its login operation does it.
 *
 * Plus a "signed in" hint cookie (not HTTP-only, no secret in it) that only tells the cached public
 * pages' header to show "Fiókom" instead of "Belépés"; the pages themselves never read the session.
 */
import { addSessionToUser, generatePayloadCookie } from 'payload/shared';
import { createLocalReq, getFieldsToSign, jwtSign, type Payload, type PayloadRequest, type TypedUser } from 'payload';

export const SIGNED_IN_COOKIE = 'morpheus-signed-in';

/** Set-Cookie value for the hint; `expires` in the past removes it. */
export function signedInCookie(expires: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SIGNED_IN_COOKIE}=1; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax${secure}`;
}

/** Adds the hint cookie to a Payload REST response (login / refresh / logout hooks). */
export function setSignedInHint(req: PayloadRequest, expires: Date) {
  req.responseHeaders ??= new Headers();
  req.responseHeaders.append('Set-Cookie', signedInCookie(expires));
}

/** A new session for the user: the token and the `payload-token` cookie to set. */
export async function issueSession(payload: Payload, userId: number | string) {
  const collectionConfig = payload.collections.users.config;
  const req = await createLocalReq({}, payload);
  // the raw row, as Payload's login uses it: addSessionToUser writes the whole object back
  const user = (await payload.db.findOne({ collection: 'users', req, where: { id: { equals: userId } } })) as TypedUser | null;
  if (!user) throw new Error(`issueSession: no user ${userId}`);
  const { sid } = await addSessionToUser({ collectionConfig, payload, req, user });
  const fieldsToSign = getFieldsToSign({ collectionConfig, email: user.email, sid, user });
  const { exp, token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration: collectionConfig.auth.tokenExpiration });
  const cookie = generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  });
  return { token, expires: new Date(exp * 1000), cookie };
}
