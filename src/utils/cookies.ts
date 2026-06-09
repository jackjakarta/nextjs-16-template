import { cookies } from 'next/headers';

import { appLocaleSchema, type AppLocale } from './types';

export type SetCookieParams = {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'strict' | 'lax';
  httpOnly?: boolean;
  secure?: boolean;
};

export async function setCookie({
  name,
  value,
  path,
  maxAge,
  sameSite = 'lax',
  httpOnly = true,
  secure = process.env.NODE_ENV === 'production',
}: SetCookieParams) {
  const cookieStore = await cookies();

  cookieStore.set({
    name,
    value,
    path,
    maxAge,
    sameSite,
    httpOnly,
    secure,
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

export async function getLocaleFromCookies(): Promise<AppLocale> {
  const locale = await getCookieValue('user_pref.app_locale');
  const parsedLocale = appLocaleSchema.safeParse(locale);

  if (!parsedLocale.success) {
    return 'en';
  }

  return parsedLocale.data;
}
