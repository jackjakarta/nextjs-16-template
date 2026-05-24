import { hc } from 'hono/client';

import { type AppType } from './hono-app';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

export const honoClient = hc<AppType>(`${baseUrl}`);
