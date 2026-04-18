import { db } from '@/db';
import { jobTable } from '@/db/schema/jobs';
import { sql } from 'drizzle-orm';

import './definitions';

import { getJobDefinition, type JobType } from './registry';

type EnqueueOptions = {
  maxAttempts?: number;
  runAt?: Date;
};

export async function enqueueJob<TPayload extends Record<string, unknown>>(
  type: JobType,
  payload: TPayload,
  options?: EnqueueOptions,
) {
  const definition = getJobDefinition(type);

  await db.insert(jobTable).values({
    type,
    payload,
    maxAttempts: options?.maxAttempts ?? definition?.maxAttempts ?? 3,
    runAt: options?.runAt ?? new Date(),
  });

  await db.execute(sql`NOTIFY job_available`);
}
