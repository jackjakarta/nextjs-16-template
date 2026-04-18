import { z } from 'zod';

export const jobTypeSchema = z.enum(['test-job']);

export type JobType = z.infer<typeof jobTypeSchema>;

type JobHandler<TPayload> = (payload: TPayload) => Promise<void>;
type JobCallback<TPayload> = (payload: TPayload) => Promise<void>;

type JobDefinition<TPayload = unknown> = {
  type: JobType;
  handler: JobHandler<TPayload>;
  maxAttempts?: number;
  timeoutMs?: number;
  onComplete?: JobCallback<TPayload>;
  onDead?: JobCallback<TPayload>;
};

type RegisteredJob = {
  handler: JobHandler<unknown>;
  maxAttempts: number;
  timeoutMs: number;
  onComplete?: JobCallback<unknown>;
  onDead?: JobCallback<unknown>;
};

const registry = new Map<string, RegisteredJob>();

export function defineJob<TPayload = unknown>(definition: JobDefinition<TPayload>) {
  if (registry.has(definition.type)) {
    throw new Error(`[JobRegistry] Duplicate job type: ${definition.type}`);
  }

  registry.set(definition.type, {
    handler: definition.handler as JobHandler<unknown>,
    maxAttempts: definition.maxAttempts ?? 3,
    timeoutMs: definition.timeoutMs ?? 30_000,
    onComplete: definition.onComplete as JobCallback<unknown> | undefined,
    onDead: definition.onDead as JobCallback<unknown> | undefined,
  });
}

export function getJobDefinition(type: string) {
  return registry.get(type);
}
