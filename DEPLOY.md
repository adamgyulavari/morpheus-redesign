# Deploying — Coolify on a VPS, Leafcloud Object Storage

The site and the CMS are one Docker image (Next.js + Payload). GitHub Actions builds it on every push
to `main`, pushes it to GitHub Container Registry (GHCR) and calls Coolify's deploy webhook. The VPS
only pulls and runs the image — nothing is built on the 4 GB server.

```
push to main ─▶ GitHub Actions: docker build ─▶ ghcr.io/adamgyulavari/morpheus-redesign:latest
                                   └─▶ Coolify webhook ─▶ pull image, restart container
container start ─▶ pending migrations run (prodMigrations) ─▶ server on :3000
```

What lives where:

| | where | backed up by |
|---|---|---|
| content (pages, shows, users…) | Postgres (Coolify) | Coolify scheduled backups → Leafcloud bucket |
| uploaded images/videos | Leafcloud Object Storage bucket | the bucket itself (enable versioning if you want undo) |
| code | GitHub / GHCR image | git |

The container holds no state; it can be deleted and recreated at any time.

## 1. Leafcloud Object Storage

1. Leafcloud console → **Object Storage → Create container (bucket)**: region **europe-nl**,
   e.g. `morpheus-media`, **private** visibility (files are served through the site at `/api/media/file/…`,
   never directly from the bucket).
2. Create a second bucket for database backups, e.g. `morpheus-backups` (private).
3. Create S3-compatible (EC2) credentials for the project, e.g.
   `openstack ec2 credentials create`. Note the *access key* and *secret key*.

Values for the app:

```
S3_ENDPOINT=https://leafcloud.store
S3_REGION=europe-nl
S3_BUCKET=morpheus-media
S3_ACCESS_KEY_ID=<access key>
S3_SECRET_ACCESS_KEY=<secret key>
```

## 2. Postgres in Coolify

1. Project → **+ New → Database → PostgreSQL** (17). Name it e.g. `morpheus-db`.
2. Keep it **not** publicly available. Start it.
3. Copy the **internal** connection URL (`postgres://…@<container-name>:5432/postgres`); the app
   uses it as `DATABASE_URL`.

### Scheduled backups to Leafcloud

1. Coolify → **Settings → S3 Storages → + Add**: endpoint `https://leafcloud.store`, region
   `europe-nl`, bucket `morpheus-backups`, the access/secret key. Click *Validate*.
2. Database → **Backups → Scheduled backups → + Add**: frequency e.g. `0 3 * * *` (every night at
   03:00 server time), enable **Save to S3** with the storage above, set retention (e.g. 14 local,
   60 in S3).
3. Run **Backup now** once and check that a file appears in the bucket.

Restore: Database → Backups → pick a backup → *Restore* (or download the dump and
`pg_restore --clean -d "$DATABASE_URL" dump`). Media files don't need restoring — they are in the
media bucket.

## 3. The application in Coolify

1. Project → **+ New → Docker Image**: `ghcr.io/adamgyulavari/morpheus-redesign:latest`.
   - If the GHCR package is private: on the server run
     `docker login ghcr.io -u <github user>` with a personal access token that has `read:packages`
     (or make the package public under GitHub → Packages → Package settings).
2. **Ports exposed**: `3000`.
3. **Environment variables** (mark secrets as such):

   | variable | value |
   |---|---|
   | `DATABASE_URL` | the internal URL from step 2 |
   | `PAYLOAD_SECRET` | `openssl rand -hex 32` — keep it stable, changing it logs everyone out |
   | `NEXT_PUBLIC_SERVER_URL` | e.g. `https://morpheus-szinmuhely.hu` (the public address, no trailing slash) |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the first admin, created on start-up while there are no users; remove afterwards |
   | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | from step 1 |

   Don't set `TZ`; dates are handled in Budapest time by the code.
4. **Domains**: `https://morpheus-szinmuhely.hu` (and `https://www.…` with a redirect if wanted).
   Point the DNS A record(s) to the VPS; Coolify gets a Let's Encrypt certificate automatically
   when the domain starts with `https://`.
5. **Healthcheck**: the image has one (`/api/users/me`); Coolify picks it up.
6. Deploy. In the logs you should see `Migrating: …` / `Migrated: …` (first start or after a schema
   change), then the server is ready. Open `/admin` and log in.

### Deploy webhook (GitHub → Coolify)

1. Coolify → the application → **Webhooks**: copy the *Deploy Webhook* URL.
2. Coolify → **Keys & Tokens → API tokens**: create a token with *deploy* permission.
3. GitHub → repository → **Settings → Secrets and variables → Actions**:
   `COOLIFY_WEBHOOK` = the URL, `COOLIFY_TOKEN` = the token.

From then on every push to `main` deploys (Actions → *Build and deploy*; it can also be run by hand).

## 4. First content import (once)

The production database starts empty. Import the original content from your machine through an
SSH tunnel (the database stays private):

```bash
# find the Postgres container's IP on the server: docker inspect <db container> | grep IPAddress
ssh -N -L 5434:<db container ip>:5432 root@<vps>        # keep running in another terminal

DATABASE_URL='postgres://<user>:<password>@localhost:5434/postgres' \
S3_ENDPOINT=https://leafcloud.store S3_REGION=europe-nl S3_BUCKET=morpheus-media \
S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… \
PAYLOAD_SECRET=<same as the app> \
npm run seed
```

The app must have started once before (so the migrations have run). The seed uploads the images to
the bucket and is safe to run again (it updates instead of duplicating). After it, save something in
the admin (or redeploy) so the cached pages are rebuilt.

### Moving existing uploads from disk to the bucket

If a database already has media documents whose files are on disk (`./media`, e.g. after seeding
without `S3_BUCKET`), copy the files over — the database needs no change, the filename is the key:

```bash
npm run upload-media            # ./media → S3_BUCKET, using .env; skips files already there
npm run upload-media -- <dir>   # another folder
```

Then set `S3_BUCKET` in the app's environment and restart.

## Changing the data model

1. Change the collections/blocks in `payload/`, then `npm run migrate:create -- <name>`.
2. Review the generated file in `payload/migrations/`, run `npm run migrate` locally, commit both.
3. Push — the container applies the migration when it starts. Never edit an applied migration.

## Notes

- Pages are cached and re-rendered when content is saved; an hourly Payload job re-renders the
  date-dependent pages so past shows and course starts disappear without an edit.
- Image optimisation (`next/image`) caches resized images inside the container; that cache is
  rebuilt after each deploy.
