/**
 * Copies uploads from local disk to the S3 media bucket: `npm run upload-media` (reads .env), or
 * `npm run upload-media -- <dir>` for another folder (default ./media).
 *
 * Payload stores only the filename in the database and the S3 adapter uses it as the object key
 * (no prefix), so after the copy the existing media documents — and their /api/media/file/… URLs —
 * work unchanged once S3_BUCKET is set. Objects already in the bucket are skipped, so it is safe to
 * run again.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const { S3_BUCKET: bucket, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
if (!bucket || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  console.error('Set S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (and S3_ENDPOINT, S3_REGION).');
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
});

async function exists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if ((err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

const dir = path.resolve(process.argv[2] ?? 'media');
const files = (await readdir(dir, { withFileTypes: true })).filter((f) => f.isFile() && !f.name.startsWith('.'));
let uploaded = 0;
let skipped = 0;

for (const { name } of files) {
  if (await exists(name)) {
    skipped++;
    continue;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: name,
      Body: await readFile(path.join(dir, name)),
      ContentType: MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream',
    }),
  );
  uploaded++;
  console.log(`↑ ${name}`);
}

console.log(`${uploaded} uploaded, ${skipped} already in s3://${bucket}`);
