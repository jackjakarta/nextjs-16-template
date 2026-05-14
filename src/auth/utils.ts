import { auth } from '@/auth';
import { dbGetUserById } from '@/db/functions/user';
import { type UserModel } from '@/db/schema/auth';
import { headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

export async function getSessionOrNull() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function getValidSession() {
  const session = await getSessionOrNull();

  if (session === null) {
    redirect('/login', RedirectType.replace);
  }

  return session;
}

export async function getUser(): Promise<UserModel> {
  const session = await getValidSession();
  const user = await dbGetUserById({ userId: session.user.id });

  if (user === undefined) {
    redirect('/login', RedirectType.replace);
  }

  return user;
}
