import { cookies } from 'next/headers';

import { appLocaleSchema, type AppLocale } from './types';

export type SetCookieParams = {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'strict' | 'lax';
  httpOnly?: boolean;
};

export async function setCookie({
  name,
  value,
  path,
  maxAge,
  sameSite = 'lax',
  httpOnly = true,
}: SetCookieParams) {
  const cookieStore = await cookies();

  cookieStore.set({
    name,
    value,
    httpOnly,
    sameSite,
    path,
    maxAge,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function deleteCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export async function getCookieValue(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(name)?.value;

  return cookieValue;
}

export async function getLocaleFromCookies(): Promise<AppLocale | undefined> {
  const locale = await getCookieValue('site_language');
  const parsedLocale = appLocaleSchema.safeParse(locale);

  if (!parsedLocale.success) {
    return undefined;
  }

  return parsedLocale.data;
}
