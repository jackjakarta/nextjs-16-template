'use server';

import { setCookie } from '@/utils/cookies';
import { appLocaleSchema, type AppLocale } from '@/utils/types';

export async function setLocaleCookieAction(locale: AppLocale) {
  const parsed = appLocaleSchema.safeParse(locale);
  const resolved = parsed.success ? parsed.data : 'en';

  await setCookie({
    name: 'user_pref.app_locale',
    value: resolved,
    path: '/',
    maxAge: 180 * 24 * 60 * 60,
  });
}
