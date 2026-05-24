import { getLocaleFromCookies } from '@/utils/cookies';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = await getLocaleFromCookies();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
