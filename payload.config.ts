import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { redirectsPlugin } from '@payloadcms/plugin-redirects';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { hu } from '@payloadcms/translations/languages/hu';
import { buildConfig, type Payload } from 'payload';
import sharp from 'sharp';
import { serverUrl } from './lib/env';
import { Applications } from './payload/collections/Applications';
import { CourseGroups } from './payload/collections/CourseGroups';
import { LoginTokens } from './payload/collections/LoginTokens';
import { Media } from './payload/collections/Media';
import { Pages } from './payload/collections/Pages';
import { MockPayments, Orders, Payments } from './payload/collections/payments';
import { LegalPages, Productions, Shows } from './payload/collections/productions';
import { RoomBookings } from './payload/collections/RoomBookings';
import { Rooms, StudentLinks } from './payload/collections/Rooms';
import { Sessions } from './payload/collections/Sessions';
import {
  ContactPeople,
  Courses,
  CtaBands,
  Instructors,
  Reviews,
  TeamBuildingProgrammes,
  Venues,
  Workshops,
} from './payload/collections/simple';
import { Users } from './payload/collections/Users';
import { emailAdapter } from './payload/email';
import { ApplicationSettings, BillingSettings, RoomBookingSettings, SiteSettings, Ui } from './payload/globals';
import { migrations } from './payload/migrations';
import { arrangeNav } from './payload/nav';
import { redirectsConfig, redirectsTranslationsHu } from './payload/redirects';
import { generateDescription, generateImage, generateTitle, generateURL, seoFields } from './payload/seo';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * S3-compatible object storage (Leafcloud, Amsterdam) when S3_BUCKET is set; otherwise files go to
 * ./media. The plugin is always registered (alwaysInsertFields) so the media schema — and thus the
 * migrations — are the same with and without S3.
 */
const s3 = s3Storage({
  enabled: Boolean(process.env.S3_BUCKET),
  alwaysInsertFields: true,
  collections: { media: true },
  bucket: process.env.S3_BUCKET ?? '',
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  },
});

/** The first admin, from ADMIN_EMAIL / ADMIN_PASSWORD, when the database has no users yet. */
async function ensureAdmin(payload: Payload) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const { totalDocs } = await payload.count({ collection: 'users' });
  if (totalDocs > 0) return;
  await payload.create({
    collection: 'users',
    data: { email, password, lastName: 'Adminisztrátor', firstName: 'Morpheus', roles: ['admin'], _verified: true },
    disableVerificationEmail: true,
  });
  payload.logger.info(`Created the first admin user: ${email}`);
}

export default buildConfig({
  serverURL: serverUrl() || undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' — Morpheus admin' },
    // the Morpheus look (app/(payload)/custom.scss) is designed for the dark theme only
    theme: 'dark',
    components: {
      graphics: {
        Logo: '@/payload/components/Graphics#AdminLogo',
        Icon: '@/payload/components/Graphics#AdminIcon',
      },
      providers: ['@/payload/components/AdminTheme#AdminTheme'],
      // back to the website, in the header
      actions: ['@/payload/components/SiteLink#SiteLink'],
      // Irányítópult, Jelentkezések, Teremnaptár above the groups (payload/nav.ts)
      beforeNavLinks: ['@/payload/components/NavTop#NavTop'],
      // the admin home: to-dos, the coming week, quick actions — above the card grid
      beforeDashboard: ['@/payload/components/AdminHome#AdminHome'],
      views: {
        // the room calendar (lib/rooms, components/rooms)
        teremnaptar: { Component: '@/payload/views/RoomCalendarView#RoomCalendarView', path: '/teremnaptar' },
        // payments, admissions, reviews (lib/applications, components/applications)
        jelentkezesek: { Component: '@/payload/views/ApplicationsView#ApplicationsView', path: '/jelentkezesek' },
      },
    },
    dateFormat: 'yyyy. MM. dd. HH:mm',
    livePreview: {
      breakpoints: [
        { label: 'Telefon', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 820, height: 1180 },
        { label: 'Asztali', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  i18n: { supportedLanguages: { hu }, fallbackLanguage: 'hu', translations: { hu: redirectsTranslationsHu } },
  // sidebar groups and their order: payload/nav.ts
  collections: arrangeNav([
    Pages,
    CtaBands,
    LegalPages,
    Productions,
    Shows,
    Venues,
    Courses,
    Workshops,
    TeamBuildingProgrammes,
    Instructors,
    Reviews,
    ContactPeople,
    CourseGroups,
    Applications,
    StudentLinks,
    Sessions,
    RoomBookings,
    Rooms,
    Media,
    Users,
    LoginTokens,
    Orders,
    Payments,
    MockPayments,
  ]),
  globals: arrangeNav([SiteSettings, Ui, RoomBookingSettings, ApplicationSettings, BillingSettings]),
  editor: lexicalEditor(),
  // SMTP when SMTP_HOST is set; otherwise e-mails (with their links) are written to the console
  email: emailAdapter(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Schema changes always go through migrations (payload/migrations, `npm run migrate:create`),
    // locally too: Drizzle's push mode would mark the database as dev-pushed, and the production
    // start-up migration would then stop at an interactive prompt.
    push: false,
    // In production (NODE_ENV=production) pending migrations run when Payload starts, i.e. when
    // the container starts (instrumentation.ts initialises Payload).
    prodMigrations: migrations,
    migrationDir: path.resolve(dirname, 'payload/migrations'),
  }),
  sharp,
  plugins: [
    // SEO tab (meta title, description, sharing image, Google preview) on pages and productions
    seoPlugin({
      collections: ['pages', 'productions'],
      uploadsCollection: 'media',
      tabbedUI: true,
      fields: seoFields,
      generateTitle,
      generateDescription,
      generateImage,
      generateURL,
    }),
    // old / retired addresses → current pages (see payload/redirects.ts)
    redirectsPlugin(redirectsConfig),
    s3,
  ],
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  onInit: ensureAdmin,
  jobs: {
    tasks: [
      {
        // Past shows, course starts and sessions drop off the site: re-render the date-dependent
        // pages every hour (revalidation must happen inside a Next.js request, hence the HTTP call).
        slug: 'revalidateDates',
        label: 'Dátumfüggő oldalak frissítése',
        schedule: [{ cron: '5 * * * *', queue: 'schedules' }],
        retries: 2,
        handler: async ({ req }) => {
          const port = process.env.PORT || '3000';
          const res = await fetch(`http://127.0.0.1:${port}/next/revalidate`, {
            method: 'POST',
            headers: { authorization: `Bearer ${req.payload.secret}` },
          });
          if (!res.ok) throw new Error(`revalidate failed: ${res.status}`);
          return { output: {} };
        },
      },
      {
        // Nyitott Műhely: at the cutoff (48 h before) the date runs or is cancelled (lib/applications)
        slug: 'workshopCutoff',
        label: 'Nyitott Műhely: döntés az indulásról',
        schedule: [{ cron: '*/5 * * * *', queue: 'schedules' }],
        retries: 2,
        handler: async ({ req }) => {
          const { runWorkshopCutoffs } = await import('./lib/applications/server');
          const decided = await runWorkshopCutoffs(req.payload);
          return { output: { decided: decided.length } };
        },
      },
      {
        // after a payment: confirmation e-mails (later: invoice, course membership) — lib/payments
        slug: 'orderPaid',
        label: 'Fizetés után: visszaigazolás',
        inputSchema: [{ name: 'orderId', type: 'number', required: true }],
        retries: 3,
        handler: async ({ input, req }) => {
          const { afterPaid } = await import('./lib/payments/service');
          await afterPaid(req.payload, input.orderId);
          return { output: {} };
        },
      },
    ],
    autoRun: [
      { cron: '* * * * *', queue: 'schedules' },
      { cron: '* * * * *', queue: 'payments' },
    ],
    // only inside the web server — not in CLI runs (migrate, seed)
    shouldAutoRun: () => Boolean(process.env.NEXT_RUNTIME),
  },
});
