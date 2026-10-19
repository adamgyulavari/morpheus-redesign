/**
 * Where the end-to-end suites run (tests/e2e/README.md): the dev server, Mailpit, Chrome, and a
 * folder for screenshots. Each can be set by an environment variable.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import puppeteer from 'puppeteer-core';

export const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
export const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025';
export const OUT = process.env.E2E_OUT ?? mkdtempSync(path.join(tmpdir(), 'morpheus-e2e-'));

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const launch = () => puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 240000 });
