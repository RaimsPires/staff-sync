import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, type Locale } from './config';

export default getRequestConfig(async () => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = c === 'fr' ? 'fr' : 'en';
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
