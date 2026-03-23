import { getLocaleFromCookies } from '@/utils/cookies';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const cookiesLocale = await getLocaleFromCookies();
  const locale = cookiesLocale ?? 'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
