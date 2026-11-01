import { describe, expect, it } from 'vitest';

import { barionAmounts, barionProvider, mapBarionStatus } from './barion';

describe('Barion status mapping', () => {
  it('maps every Barion status', () => {
    expect(mapBarionStatus('Prepared', 5000, 0)).toBe('open');
    expect(mapBarionStatus('Started', 5000, 0)).toBe('open');
    expect(mapBarionStatus('InProgress', 5000, 0)).toBe('pending');
    expect(mapBarionStatus('Waiting', 5000, 0)).toBe('pending');
    expect(mapBarionStatus('Reserved', 5000, 0)).toBe('pending');
    expect(mapBarionStatus('Authorized', 5000, 0)).toBe('pending');
    expect(mapBarionStatus('Succeeded', 5000, 0)).toBe('paid');
    expect(mapBarionStatus('PartiallySucceeded', 5000, 0)).toBe('paid');
    expect(mapBarionStatus('Failed', 5000, 0)).toBe('failed');
    expect(mapBarionStatus('Expired', 5000, 0)).toBe('expired');
    expect(mapBarionStatus('Canceled', 5000, 0)).toBe('canceled');
  });
  it('a paid payment with refunds is (partially) refunded', () => {
    expect(mapBarionStatus('Succeeded', 5000, 2000)).toBe('partially_refunded');
    expect(mapBarionStatus('Succeeded', 5000, 5000)).toBe('refunded');
  });
});

describe('Barion amounts', () => {
  const tx = (o: Partial<Parameters<typeof barionAmounts>[0]['Transactions'][number]>) => ({
    TransactionId: 't',
    POSTransactionId: null,
    TransactionType: 'CardPayment',
    Status: 'Succeeded',
    Total: 0,
    Currency: 'HUF',
    RelatedId: null,
    ...o,
  });
  const payment = (transactions: ReturnType<typeof tx>[], Currency = 'HUF') => ({
    PaymentId: 'p',
    Status: 'Succeeded',
    Currency,
    CompletedAt: null,
    FundingSource: 'BankCard',
    Transactions: transactions,
  });
  const shop = tx({ TransactionId: 'shop', POSTransactionId: '12-ab', Total: 7000 });

  it('the shop transaction is the amount; fees are not', () => {
    const fee = tx({ TransactionId: 'fee', TransactionType: 'GatewayFee', Total: 70 });
    expect(barionAmounts(payment([shop, fee]))).toEqual({ amount: 7000, amountRefunded: 0 });
  });
  it('only succeeded refunds of the shop transaction count', () => {
    const refund = (Total: number, Status = 'Succeeded') =>
      tx({ TransactionId: `r${Total}`, TransactionType: 'RefundToBankCard', RelatedId: 'shop', Status, Total });
    expect(barionAmounts(payment([shop, refund(2000), refund(1500), refund(900, 'Failed')]))).toEqual({
      amount: 7000,
      amountRefunded: 3500,
    });
  });
  it('anything else than HUF is refused', () => {
    expect(() => barionAmounts(payment([shop], 'EUR'))).toThrow();
  });
});

describe('Barion callback', () => {
  const req = (query: string, body = '') =>
    new Request(`http://x/api/payments/webhook${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
  const id = '64157032d3dc4296aedafd4b0994c64e';
  it('takes only the payment id, from the query or the body', async () => {
    expect(await barionProvider.parseWebhook(req(`?paymentId=${id}`))).toEqual({ providerPaymentId: id });
    expect(await barionProvider.parseWebhook(req('', `paymentId=${id}&Status=Succeeded`))).toEqual({
      providerPaymentId: id,
    });
    const dashed = '64157032-d3dc-4296-aeda-fd4b0994c64e';
    expect(await barionProvider.parseWebhook(req('', `paymentId=${dashed}`))).toEqual({ providerPaymentId: dashed });
  });
  it('anything else is not ours', async () => {
    expect(await barionProvider.parseWebhook(req('', 'id=tr_WDqYK6vllg'))).toBeNull();
    expect(await barionProvider.parseWebhook(req('', 'paymentId=mock_1'))).toBeNull();
    expect(await barionProvider.parseWebhook(req(''))).toBeNull();
  });
});
