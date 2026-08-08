import { db } from '@/db';
import { jobTable } from '@/db/schema/jobs';
import { sql } from 'drizzle-orm';

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

  await db.transaction(async (tx) => {
    await tx.insert(jobTable).values({
      type,
      payload,
      maxAttempts: options?.maxAttempts ?? definition?.maxAttempts,
      runAt: options?.runAt,
    });

    await tx.execute(sql`NOTIFY job_available`);
  });
}
