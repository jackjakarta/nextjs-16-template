'use server';

import { getSessionOrNull } from '@/auth/utils';
import { setCookie } from '@/utils/cookies';
import { appLocaleSchema, type AppLocale } from '@/utils/types';

export async function setLocaleAction(locale: AppLocale) {
  const parsed = appLocaleSchema.safeParse(locale);
  const resolved = parsed.success ? parsed.data : 'en';

  await setCookie({
    name: 'user_pref.app_locale',
    value: resolved,
    path: '/',
    maxAge: 180 * 24 * 60 * 60,
  });
}

export async function setUserIdCookie() {
  const session = await getSessionOrNull();

  if (session === null) {
    console.error('[COOKIES ERROR]', 'No user_id to set');
    return;
  }

  await setCookie({
    name: 'analytics.user_id',
    value: session.user.id,
    path: '/',
    maxAge: 180 * 24 * 60 * 60,
  });
}
