/**
 * Screenshots every page block for the admin's "add block" drawer: `npm run block-thumbnails`
 * (with `npm run dev` running and the database seeded). Each block is rendered alone by
 * /next/block-preview/<type> (development only), captured with the installed Chrome and saved as
 * a 600×400 (3:2) thumbnail in public/admin/blocks/<type>.webp — the payload/blocks configs
 * reference them by that name. A block that renders nothing with today's content (e.g. past
 * workshops when there are none) gets a simple labelled card.
 *
 * Only missing thumbnails and placeholders are (re)tried; existing ones are kept:
 *   npm run block-thumbnails                    missing + placeholders
 *   npm run block-thumbnails -- repertoire path  just these blocks
 *   npm run block-thumbnails -- --force          all of them (after a design change)
 *
 * A screenshot made by hand wins: put it at scripts/block-thumbnails/<type>.png (the top of the
 * block, full width) and it is cropped and resized like the captured ones, without opening Chrome.
 */
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

import { blocks } from '@/payload/blocks';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:3000';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.join(process.cwd(), 'public', 'admin', 'blocks');
const BIO = new Set(['bioIntro', 'bioNextShow', 'linkList', 'socialLinks', 'contactFooter']);
const W = 600;
const H = 400;
const CREAM = { r: 247, g: 241, b: 232, alpha: 1 };

const labels = new Map(
  blocks.map((b) => [b.slug, typeof b.labels?.singular === 'string' ? b.labels.singular : b.slug]),
);

/** A plain card with the block's name, for blocks that render nothing with the current content. */
async function placeholder(slug: string, label: string) {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="100%" height="100%" fill="#f7f1e8"/>
    <rect x="48" y="70" width="90" height="10" rx="5" fill="#0f5f63"/>
    <text x="48" y="140" font-family="Georgia, serif" font-size="42" fill="#10292c">${esc(label)}</text>
    ${[0, 1, 2].map((i) => `<rect x="${48 + i * 172}" y="190" width="152" height="150" rx="16" fill="#fffaf2" stroke="#e4d8c6" stroke-width="2"/>`).join('')}
  </svg>`;
  await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toFile(path.join(OUT, `${slug}.webp`));
}

await mkdir(OUT, { recursive: true });

// which thumbnails are placeholders (retried on every run until a real screenshot works)
const PLACEHOLDERS = path.join(process.cwd(), 'scripts', 'block-thumbnails.placeholders.json');
const placeholders = new Set<string>(JSON.parse(await readFile(PLACEHOLDERS, 'utf-8').catch(() => '[]')) as string[]);
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const exists = (slug: string) =>
  access(path.join(OUT, `${slug}.webp`)).then(
    () => true,
    () => false,
  );
/** A hand-made screenshot that is newer than the thumbnail made from it. */
const newManual = async (slug: string) => {
  const [m, t] = await Promise.all(
    [path.join('scripts', 'block-thumbnails', `${slug}.png`), path.join(OUT, `${slug}.webp`)].map((f) =>
      stat(f).catch(() => null),
    ),
  );
  return Boolean(m && (!t || m.mtimeMs > t.mtimeMs));
};
const todo = [];
for (const b of blocks) {
  const wanted = only.length
    ? only.includes(b.slug)
    : force || placeholders.has(b.slug) || !(await exists(b.slug)) || (await newManual(b.slug));
  if (wanted) todo.push(b);
}
console.log(
  todo.length
    ? `Capturing ${todo.length} of ${blocks.length} blocks…`
    : 'All thumbnails exist (use --force to redo them).',
);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const failed: string[] = [];

const MANUAL = path.join(process.cwd(), 'scripts', 'block-thumbnails');

/** Fit the width, keep the top of tall images, centre short ones on the page colour. */
async function save(slug: string, png: Uint8Array) {
  const { data, info } = await sharp(png)
    .resize({ width: BIO.has(slug) ? 300 : W })
    .png()
    .toBuffer({ resolveWithObject: true });
  const tall = info.height > H;
  const input = tall ? await sharp(data).extract({ left: 0, top: 0, width: info.width, height: H }).toBuffer() : data;
  await sharp({ create: { width: W, height: H, channels: 4, background: CREAM } })
    .composite([{ input, top: tall ? 0 : Math.floor((H - info.height) / 2), left: Math.floor((W - info.width) / 2) }])
    .webp({ quality: 80 })
    .toFile(path.join(OUT, `${slug}.webp`));
}

for (const { slug } of todo) {
  const manual = await readFile(path.join(MANUAL, `${slug}.png`)).catch(() => null);
  if (manual) {
    await save(slug, manual);
    placeholders.delete(slug);
    console.log(`✓ ${slug} (from scripts/block-thumbnails/${slug}.png)`);
    continue;
  }
  // a tall viewport, so lazy images are inside it and load
  await page.setViewport({ width: BIO.has(slug) ? 480 : 1440, height: 2400 });
  const res = await page.goto(`${BASE}/next/block-preview/${slug}`, { waitUntil: 'load', timeout: 60_000 });
  if (!res?.ok()) {
    failed.push(slug);
    continue;
  }
  // let client-side effects settle (the repertoire filter updates the URL after loading)
  await new Promise((r) => setTimeout(r, 1500));
  let shot: Uint8Array | undefined;
  for (let attempt = 0; attempt < 3 && !shot; attempt++) {
    try {
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null))));
      });
      const box = await (await page.$('#block-preview'))?.boundingBox();
      // only the top is visible in a 3:2 thumbnail; blocks that render nothing today get a placeholder
      if (!box || box.height < 4) break;
      const width = BIO.has(slug) ? 480 : 1440;
      shot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: box.y, width, height: Math.min(box.height, (width * H) / (BIO.has(slug) ? 300 : W)) },
      });
    } catch (err) {
      console.warn(`  ${slug}: ${(err as Error).message.split('\n')[0]} — retrying`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!shot) {
    await placeholder(slug, labels.get(slug) ?? slug);
    placeholders.add(slug);
    console.log(
      `○ ${slug}: no screenshot (renders nothing today, or the capture failed) — placeholder; a manual scripts/block-thumbnails/${slug}.png replaces it`,
    );
    continue;
  }
  await save(slug, shot);
  placeholders.delete(slug);
  console.log(`✓ ${slug}`);
}

await browser.close();
await writeFile(PLACEHOLDERS, `${JSON.stringify([...placeholders].sort(), null, 2)}\n`);
if (failed.length) {
  console.error(`No preview for: ${failed.join(', ')}`);
  process.exitCode = 1;
}
