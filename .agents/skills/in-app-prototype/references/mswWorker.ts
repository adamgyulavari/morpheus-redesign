import { setupWorker } from 'msw/browser';

export const worker = setupWorker();

let startPromise: Promise<unknown> | null = null;

export const startWorker = () => {
  startPromise ??= worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  return startPromise;
};
