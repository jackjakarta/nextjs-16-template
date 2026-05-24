import { Hono } from 'hono';

import { exampleRouteGroup } from './routes/example';

export const app = new Hono().basePath('/api');

export const routes = app
  .get('/health', async (ctx) => {
    return ctx.json('Ok', { status: 200 });
  })
  .route('/', exampleRouteGroup);

export type AppType = typeof routes;
