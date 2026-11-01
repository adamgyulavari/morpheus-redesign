import { describe, expect, it } from 'vitest';

import { mergedProfile } from './merge';

const preloaded = {
  id: 1,
  name: 'Kiss Anna',
  email: 'anna@ceg.hu',
  googleSub: null,
  phone: '+36 30 123 4567',
  _verified: false,
  roomBooking: true,
  billing: { name: 'Kiss Anna', zip: '1027', city: 'Budapest', address: 'Fő u. 1.', country: 'HU' },
  roles: ['student' as const],
};
const fromGoogle = {
  id: 2,
  name: 'Kiss Anna',
  email: 'anna.kiss@gmail.com',
  googleSub: 'g-123',
  phone: null,
  _verified: true,
  roomBooking: false,
  billing: {},
  roles: ['guest' as const],
};

describe('mergedProfile', () => {
  it('keeps the opened account, takes the Google login and verification from the other', () => {
    const m = mergedProfile(preloaded, fromGoogle, 'keep');
    expect(m).toMatchObject({
      ok: true,
      email: 'anna@ceg.hu',
      googleSub: 'g-123',
      phone: '+36 30 123 4567',
      verified: true,
      roomBooking: true,
      roles: ['student'],
    });
    expect(m.ok && m.billing?.city).toBe('Budapest');
  });
  it('the e-mail can be the other one', () => {
    expect(mergedProfile(preloaded, fromGoogle, 'drop')).toMatchObject({ email: 'anna.kiss@gmail.com' });
  });
  it('billing from the other when the kept one has none', () => {
    const m = mergedProfile({ ...fromGoogle, id: 3 }, { ...preloaded, id: 4 }, 'keep');
    expect(m.ok && m.billing?.name).toBe('Kiss Anna');
  });
  it('a guest only when both are guests', () => {
    expect(mergedProfile({ ...fromGoogle, id: 5 }, fromGoogle, 'keep')).toMatchObject({ roles: ['guest'] });
  });
  it('refuses the same account, an admin to be deleted, two different Google accounts', () => {
    expect(mergedProfile(preloaded, preloaded, 'keep').ok).toBe(false);
    expect(mergedProfile(preloaded, { ...fromGoogle, roles: ['admin'] }, 'keep').ok).toBe(false);
    expect(mergedProfile({ ...preloaded, googleSub: 'g-999' }, fromGoogle, 'keep').ok).toBe(false);
  });
});
