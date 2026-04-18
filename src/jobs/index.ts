import { JobWorker } from './worker';

export { defineJob } from './registry';

export async function startWorker() {
  // side-effect imports register handlers
  await import('./definitions');

  const worker = new JobWorker();

  async function shutdown() {
    await worker.stop();
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  await worker.start();
}
