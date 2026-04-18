import { defineJob } from '../registry';

export type TestJobJobPayload = {
  mockId: string;
};

defineJob<TestJobJobPayload>({
  type: 'test-job',
  timeoutMs: 10 * 60 * 1000,
  maxAttempts: 2,
  handler: async (payload) => {
    console.info('Job Executed', payload);
  },
});
