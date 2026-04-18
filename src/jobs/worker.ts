import { db } from '@/db';
import { jobTable, type JobModel } from '@/db/schema/jobs';
import { and, eq, lte, sql } from 'drizzle-orm';
import { Client } from 'pg';

import { getJobDefinition } from './registry';

const POLL_INTERVAL_MS = 60_000;
const CHANNEL = 'job_available';

export class JobWorker {
  private listenClient: Client | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private processing = false;

  async start() {
    this.running = true;
    console.info('[JobWorker] Starting...');

    await this.recoverStaleJobs();
    await this.connectListener();
    this.startPolling();

    console.info('[JobWorker] Ready');
    void this.processNextJob();
  }

  async stop() {
    console.info('[JobWorker] Shutting down...');
    this.running = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.listenClient) {
      try {
        await this.listenClient.query(`UNLISTEN ${CHANNEL}`);
        await this.listenClient.end();
      } catch {
        // Ignore errors during shutdown
      }
      this.listenClient = null;
    }

    console.info('[JobWorker] Stopped');
  }

  private async connectListener() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    this.listenClient = client;

    client.on('notification', () => {
      void this.processNextJob();
    });

    client.on('error', (err) => {
      console.error('[JobWorker] LISTEN client error:', err.message);
      void this.reconnectListener();
    });

    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
  }

  private async reconnectListener() {
    if (!this.running) return;

    this.listenClient = null;

    console.warn('[JobWorker] Reconnecting LISTEN client in 5s...');
    await new Promise((resolve) => setTimeout(resolve, 5_000));

    if (!this.running) return;

    try {
      await this.connectListener();
      console.info('[JobWorker] LISTEN client reconnected');
    } catch (err) {
      console.error('[JobWorker] Reconnection failed:', err);
      void this.reconnectListener();
    }
  }

  private startPolling() {
    this.pollTimer = setInterval(() => {
      void this.processNextJob();
    }, POLL_INTERVAL_MS);
  }

  private async processNextJob() {
    if (!this.running || this.processing) return;
    this.processing = true;

    try {
      const job = await this.claimJob();
      if (!job) {
        this.processing = false;
        return;
      }

      await this.executeJob(job);

      this.processing = false;
      void this.processNextJob();
    } catch (err) {
      console.error('[JobWorker] Unexpected error in processNextJob:', err);
      this.processing = false;
    }
  }

  private async claimJob(): Promise<JobModel | null> {
    const now = new Date();

    const result = await db.execute<JobModel>(sql`
      UPDATE ${jobTable}
      SET ${sql.raw(`status = 'running'`)},
          ${sql.raw(`started_at = NOW()`)},
          ${sql.raw(`attempts = attempts + 1`)}
      WHERE id = (
        SELECT id FROM ${jobTable}
        WHERE status = 'pending'
          AND run_at <= ${now}
        ORDER BY run_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `);

    return result.rows[0] ?? null;
  }

  private async executeJob(job: JobModel) {
    const definition = getJobDefinition(job.type);

    if (!definition) {
      console.error(`[JobWorker] No handler registered for job type: ${job.type}`);
      await this.failJob(job, `No handler registered for job type: ${job.type}`);
      return;
    }

    try {
      const result = await Promise.race([
        definition.handler(job.payload),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Job timed out')), definition.timeoutMs),
        ),
      ]);

      void result;

      await db
        .update(jobTable)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(jobTable.id, job.id));

      await definition.onComplete?.(job.payload);

      console.info(`[JobWorker] Completed job ${job.id} (${job.type})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[JobWorker] Job ${job.id} (${job.type}) failed: ${message}`);

      if (err instanceof Error && err.stack) {
        console.error(err.stack);
      }

      await this.failJob(job, message);
    }
  }

  private async failJob(job: JobModel, error: string) {
    const maxAttempts = getJobDefinition(job.type)?.maxAttempts ?? job.maxAttempts;
    const isDead = job.attempts >= maxAttempts;

    if (isDead) {
      await db
        .update(jobTable)
        .set({ status: 'dead', lastError: error })
        .where(eq(jobTable.id, job.id));

      await getJobDefinition(job.type)?.onDead?.(job.payload);

      console.error(
        `[JobWorker] Job ${job.id} (${job.type}) is dead after ${job.attempts} attempts`,
      );
    } else {
      const backoffMs = Math.pow(2, job.attempts) * 5_000;
      const runAt = new Date(Date.now() + backoffMs);

      await db
        .update(jobTable)
        .set({ status: 'pending', lastError: error, runAt })
        .where(eq(jobTable.id, job.id));

      console.warn(
        `[JobWorker] Job ${job.id} (${job.type}) retry #${job.attempts} scheduled for ${runAt.toISOString()}`,
      );
    }
  }

  private async recoverStaleJobs() {
    const result = await db
      .update(jobTable)
      .set({ status: 'pending' })
      .where(
        and(
          eq(jobTable.status, 'running'),
          lte(jobTable.startedAt, new Date(Date.now() - 5 * 60_000)),
        ),
      )
      .returning({ id: jobTable.id });

    if (result.length > 0) {
      console.info(`[JobWorker] Recovered ${result.length} stale job(s)`);
    }
  }
}
