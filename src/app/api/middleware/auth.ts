import { auth } from '@/auth';
import { createMiddleware } from 'hono/factory';

export type AuthEnv = {
  Variables: {
    userId: string;
    userName: string;
    userEmail: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (ctx, next) => {
  const session = await auth.api.getSession({
    headers: ctx.req.raw.headers,
  });

  if (session === null) {
    return ctx.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ctx.set('userId', session.user.id);
  ctx.set('userName', session.user.name);
  ctx.set('userEmail', session.user.email);
  await next();
});
