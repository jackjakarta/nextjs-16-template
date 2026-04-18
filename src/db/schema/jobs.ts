import { type JobType } from '@/jobs/registry';
import { index, integer, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const jobsSchema = pgSchema('jobs');

export const jobStatusEnum = z.enum(['pending', 'running', 'completed', 'failed', 'dead']);
export type JobStatus = z.infer<typeof jobStatusEnum>;

export const jobTable = jobsSchema.table(
  'job',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').$type<JobType>().notNull(),
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
    status: text('status').$type<JobStatus>().notNull().default('pending'),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    lastError: text('last_error'),
    runAt: timestamp('run_at', { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('job_status_run_at_idx').on(table.status, table.runAt),
    index('job_type_idx').on(table.type),
  ],
);

export type JobModel = typeof jobTable.$inferSelect;
export type InsertJobModel = typeof jobTable.$inferInsert;
