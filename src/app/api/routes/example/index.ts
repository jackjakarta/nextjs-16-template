import { authMiddleware } from '@/app/api/middleware/auth';
import { Hono } from 'hono';

import { examplePostHandler, examplesGetHandler } from './handler';

export const exampleRouteGroup = new Hono()
  .basePath('/example')
  .use(authMiddleware)
  .get('/', async (ctx) => {
    return examplesGetHandler(ctx);
  })
  .get('/:id', async () => {
    // follow pattern
    return;
  })
  .post('/', async (ctx) => {
    return examplePostHandler(ctx);
  });
