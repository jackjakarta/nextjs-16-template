import { type AuthEnv } from '@/app/api/middleware/auth';
import { Context } from 'hono';
import { z } from 'zod';

// this would normally come from the db schema type exports
// remove after understanding pattern
export type MockDbType = {
  id: string;
  userId: string;
};

export async function examplesGetHandler(ctx: Context<AuthEnv>) {
  try {
    const userId = ctx.var.userId;

    const mockDataFromDb: MockDbType[] = [
      {
        id: 'dsadsa',
        userId,
      },
    ];

    return ctx.json({ success: true, data: mockDataFromDb }, { status: 200 });
  } catch (error) {
    console.error('[ENDPOINT POST HANDLER]', error);
    return ctx.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

const endpointRequestBodySchema = z.object({
  exampleKey: z.uuid(),
});

export async function examplePostHandler(ctx: Context<AuthEnv>) {
  try {
    const userId = ctx.var.userId;

    const json = await ctx.req.json();
    const parsed = endpointRequestBodySchema.safeParse(json);

    if (!parsed.success) {
      return ctx.json({ success: false, error: parsed.error.issues }, { status: 400 });
    }

    const dataWithUserId = {
      ...parsed.data,
      userId,
    };

    return ctx.json({ success: true, data: dataWithUserId }, { status: 200 });
  } catch (error) {
    console.error('[ENDPOINT POST HANDLER]', error);
    return ctx.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
