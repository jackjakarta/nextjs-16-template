import { getSessionOrNull } from '@/auth/utils';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import LoginForm from './login-form';

export default async function LoginPage() {
  const [session, t] = await Promise.all([getSessionOrNull(), getTranslations('auth.login')]);

  if (session !== null) {
    redirect('/');
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t('heading')}</h1>
        <p className="text-gray-500">{t('sub-heading')}</p>
        <LoginForm />
      </div>
    </div>
  );
}
