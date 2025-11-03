import { db } from '@/db';
import { accountTable, sessionTable, userTable, verificationTable } from '@/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendResetPassword: async ({ user, url }, request) => {
      console.info({ info: 'Sending reset password email' });
    },
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendVerificationEmail: async ({ user, url }, request) => {
      console.info({ info: 'Sending verification email' });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    nextCookies(), // this must be the last plugin in the array
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user_entity: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  user: {
    modelName: 'user_entity',
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});
