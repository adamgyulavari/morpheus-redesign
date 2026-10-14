/**
 * Money: orders (one checkout = one application), payments (one provider attempt each) and the
 * mock provider's fake payments. Written by lib/payments; the admin reads them (fixes: admins only).
 * Amounts are whole forints.
 */
import type { CollectionConfig } from 'payload';

import { isAdmin, isStaffOrAdmin, userIsStaffOrAdmin } from '../access';
import { relationship, text } from '../fields';

const huf = (name: string, label: string, description?: string) =>
  ({ name, label, type: 'number', min: 0, required: true, defaultValue: 0, admin: { description } }) as const;

const moment = (name: string, label: string) =>
  ({
    name,
    label,
    type: 'date',
    admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy. MM. dd. HH:mm' } },
  }) as const;

export const ORDER_STATUSES = {
  pending: 'Fizetésre vár',
  paid: 'Fizetve',
  expired: 'Lejárt',
  canceled: 'Megszakítva',
  refunded: 'Visszatérítve',
  partially_refunded: 'Részben visszatérítve',
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const PAYMENT_STATUSES = {
  pending: 'Folyamatban',
  paid: 'Fizetve',
  failed: 'Sikertelen',
  expired: 'Lejárt',
  canceled: 'Megszakítva',
  refunded: 'Visszatérítve',
  partially_refunded: 'Részben visszatérítve',
} as const;

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ label, value }));

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Rendelés', plural: 'Rendelések' },
  access: {
    // their own (the result page, /fiokom); everything is written by lib/payments
    read: ({ req: { user } }) => (userIsStaffOrAdmin(user) ? true : user ? { user: { equals: user.id } } : false),
    create: () => false,
    update: isAdmin,
    delete: () => false,
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'user', 'status', 'price', 'creditUsed', 'amountDue', 'createdAt'],
    description:
      'Online jelentkezések fizetése: egy rendelés = egy jelentkezés. A rendszer írja; javítani csak adminisztrátor tud.',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { ...relationship('user', 'Fiók', 'users', { required: true }), index: true },
        { ...relationship('application', 'Jelentkezés', 'applications'), index: true },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Fajta',
          type: 'select',
          required: true,
          options: [
            { label: 'Nyitott Műhely', value: 'workshop' },
            { label: 'Kezdő kurzus', value: 'beginner' },
            { label: 'Havidíj', value: 'monthlyFee' },
          ],
        },
        {
          name: 'status',
          label: 'Állapot',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          index: true,
          options: options(ORDER_STATUSES),
        },
      ],
    },
    text('label', 'Megnevezés', { required: true }),
    {
      type: 'row',
      fields: [
        huf('price', 'Ár (Ft)'),
        huf('creditUsed', 'Kreditből (Ft)'),
        huf('amountDue', 'Fizetendő (Ft)', 'Ár − kredit: ennyit fizet kártyával.'),
      ],
    },
    {
      type: 'row',
      fields: [{ ...moment('expiresAt', 'Foglalás lejár'), index: true }, moment('paidAt', 'Fizetve')],
    },
    {
      name: 'billing',
      label: 'Számlázási adatok (a rendeléskor)',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [text('name', 'Név'), text('taxNumber', 'Adószám')],
        },
        {
          type: 'row',
          fields: [text('zip', 'Irányítószám'), text('city', 'Város'), text('country', 'Ország')],
        },
        text('address', 'Cím'),
      ],
    },
    {
      // in the URLs (result page, payment links): not guessable like an id
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { read: ({ req: { user } }) => Boolean(user) },
      admin: { hidden: true },
    },
    {
      name: 'payments',
      label: 'Fizetések',
      type: 'join',
      collection: 'payments',
      on: 'order',
      admin: { defaultColumns: ['provider', 'status', 'amount', 'paidAt', 'createdAt'] },
    },
  ],
};

export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: { singular: 'Fizetés', plural: 'Fizetések' },
  access: { read: isStaffOrAdmin, create: () => false, update: isAdmin, delete: () => false },
  admin: {
    useAsTitle: 'providerPaymentId',
    defaultColumns: ['providerPaymentId', 'order', 'provider', 'status', 'amount', 'paidAt', 'createdAt'],
    description: 'Fizetési kísérletek a fizetési szolgáltatónál (egy rendeléshez több is lehet, pl. újrapróbálás).',
  },
  defaultSort: '-createdAt',
  fields: [
    { ...relationship('order', 'Rendelés', 'orders', { required: true }), index: true },
    {
      type: 'row',
      fields: [
        text('provider', 'Szolgáltató', { required: true }),
        { ...text('providerPaymentId', 'Azonosító', { required: true }), unique: true, index: true },
      ],
    },
    {
      type: 'row',
      fields: [
        huf('amount', 'Összeg (Ft)'),
        {
          name: 'status',
          label: 'Állapot',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          index: true,
          options: options(PAYMENT_STATUSES),
        },
        moment('paidAt', 'Fizetve'),
      ],
    },
    {
      name: 'refunds',
      label: 'Visszatérítések',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            text('providerRefundId', 'Azonosító'),
            huf('amount', 'Összeg (Ft)'),
            moment('at', 'Időpont'),
            relationship('by', 'Indította', 'users'),
          ],
        },
      ],
    },
    { name: 'raw', label: 'Szolgáltató válasza', type: 'json', admin: { readOnly: true } },
    {
      name: 'log',
      label: 'Napló',
      type: 'array',
      admin: { readOnly: true, initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            moment('at', 'Időpont'),
            text('source', 'Forrás'),
            text('status', 'Állapot'),
            text('note', 'Megjegyzés'),
          ],
        },
      ],
    },
  ],
};

/** The mock provider's own "bank" (lib/payments/providers/mock.ts). Development and tests only. */
export const MockPayments: CollectionConfig = {
  slug: 'mockPayments',
  access: { read: isAdmin, create: () => false, update: () => false, delete: () => false },
  admin: { hidden: true },
  fields: [
    text('orderId', 'Rendelés', { required: true }),
    { name: 'amount', type: 'number', required: true },
    { name: 'amountRefunded', type: 'number', defaultValue: 0 },
    text('description', 'Leírás'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'paid', 'failed', 'expired', 'canceled'],
    },
    { name: 'paidAt', type: 'date' },
    text('returnUrl', 'Vissza'),
    text('webhookUrl', 'Webhook'),
  ],
};
