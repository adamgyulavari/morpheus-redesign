import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { hu } from '@payloadcms/translations/languages/hu';
import { buildConfig, type Payload } from 'payload';
import sharp from 'sharp';

import { Media } from './payload/collections/Media';
import { Pages } from './payload/collections/Pages';
import { LegalPages, Productions, Shows } from './payload/collections/productions';
import {
  ContactPeople,
  Courses,
  CtaBands,
  Instructors,
  OpenWorkshopSessions,
  Reviews,
  TeamBuildingProgrammes,
  Venues,
  Workshops,
} from './payload/collections/simple';
import { Users } from './payload/collections/Users';
import { SiteSettings, Ui } from './payload/globals';
import { migrations } from './payload/migrations';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** S3-compatible object storage (Scaleway, Paris) when configured; otherwise files go to ./media. */
const s3 = process.env.S3_BUCKET
  ? s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET,
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
      },
    })
  : null;

/** The first admin, from ADMIN_EMAIL / ADMIN_PASSWORD, when the database has no users yet. */
async function ensureAdmin(payload: Payload) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const { totalDocs } = await payload.count({ collection: 'users' });
  if (totalDocs > 0) return;
  await payload.create({ collection: 'users', data: { email, password, name: 'Adminisztrátor', role: 'admin' } });
  payload.logger.info(`Created the first admin user: ${email}`);
}

export default buildConfig({
  // bracket access: read at runtime (Next.js would inline process.env.NEXT_PUBLIC_… at build time,
  // and the Docker build has no environment)
  serverURL: process.env['NEXT_PUBLIC_SERVER_URL'] || undefined,
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
  i18n: { supportedLanguages: { hu }, fallbackLanguage: 'hu' },
  collections: [
    Pages,
    CtaBands,
    LegalPages,
    Productions,
    Shows,
    Venues,
    Courses,
    OpenWorkshopSessions,
    Workshops,
    TeamBuildingProgrammes,
    Instructors,
    Reviews,
    ContactPeople,
    Media,
    Users,
  ],
  globals: [SiteSettings, Ui],
  editor: lexicalEditor(),
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
  plugins: s3 ? [s3] : [],
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
    ],
    autoRun: [{ cron: '* * * * *', queue: 'schedules' }],
    // only inside the web server — not in CLI runs (migrate, seed)
    shouldAutoRun: () => Boolean(process.env.NEXT_RUNTIME),
  },
});
