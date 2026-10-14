import { describe, expect, it } from 'vitest';

import { movesForward, paidOrLater } from '../types';
import { fromMollieAmount, mapMollieStatus, mollieProvider, toMollieAmount } from './mollie';

describe('Mollie amounts', () => {
  it('whole forints ↔ Mollie’s HUF strings', () => {
    expect(toMollieAmount(12000)).toEqual({ currency: 'HUF', value: '12000.00' });
    expect(fromMollieAmount({ currency: 'HUF', value: '12000.00' })).toBe(12000);
    expect(fromMollieAmount(null)).toBe(0);
    expect(() => fromMollieAmount({ currency: 'EUR', value: '10.00' })).toThrow();
  });
});

describe('Mollie status mapping', () => {
  it('maps every Mollie status', () => {
    expect(mapMollieStatus('open', 5000, 0)).toBe('pending');
    expect(mapMollieStatus('pending', 5000, 0)).toBe('pending');
    expect(mapMollieStatus('authorized', 5000, 0)).toBe('pending');
    expect(mapMollieStatus('paid', 5000, 0)).toBe('paid');
    expect(mapMollieStatus('failed', 5000, 0)).toBe('failed');
    expect(mapMollieStatus('expired', 5000, 0)).toBe('expired');
    expect(mapMollieStatus('canceled', 5000, 0)).toBe('canceled');
  });
  it('a paid payment with refunds is (partially) refunded', () => {
    expect(mapMollieStatus('paid', 5000, 2000)).toBe('partially_refunded');
    expect(mapMollieStatus('paid', 5000, 5000)).toBe('refunded');
  });
});

describe('Mollie webhook', () => {
  const req = (body: string) =>
    new Request('http://x/api/payments/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
  it('takes only the payment id from the body', async () => {
    expect(await mollieProvider.parseWebhook(req('id=tr_WDqYK6vllg'))).toEqual({ providerPaymentId: 'tr_WDqYK6vllg' });
    expect(await mollieProvider.parseWebhook(req('id=tr_abc&status=paid'))).toEqual({ providerPaymentId: 'tr_abc' });
  });
  it('anything else is not ours', async () => {
    expect(await mollieProvider.parseWebhook(req('id=mock_1'))).toBeNull();
    expect(await mollieProvider.parseWebhook(req(''))).toBeNull();
    expect(await mollieProvider.parseWebhook(req('id=tr_<script>'))).toBeNull();
  });
});

describe('payment statuses only move forward', () => {
  it('a late callback can’t take a payment back', () => {
    expect(movesForward('pending', 'paid')).toBe(true);
    expect(movesForward('paid', 'pending')).toBe(false);
    expect(movesForward('paid', 'paid')).toBe(false);
    expect(movesForward('paid', 'refunded')).toBe(true);
    expect(movesForward('refunded', 'paid')).toBe(false);
    expect(movesForward('failed', 'pending')).toBe(false);
  });
  it('paid, or refunded after paying', () => {
    expect(paidOrLater('paid')).toBe(true);
    expect(paidOrLater('partially_refunded')).toBe(true);
    expect(paidOrLater('failed')).toBe(false);
    expect(paidOrLater('pending')).toBe(false);
  });
});
