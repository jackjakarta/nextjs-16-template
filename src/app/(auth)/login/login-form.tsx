'use client';

import { setUserIdCookie } from '@/actions/cookies';
import { authClient } from '@/auth/client';
import { cn } from '@/utils/tailwind';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginFormSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth.login');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    const { email: _email, password } = data;
    const email = _email.trim().toLowerCase();

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error !== null) {
      setError('root', { type: 'manual', message: error.message });
      return;
    }

    await setUserIdCookie();

    router.replace('/');
  }

  const emailValue = watch('email');
  const passwordValue = watch('password');
  const buttonDisabled = isSubmitting || isSubmitSuccessful || !emailValue || !passwordValue;

  const labelClassName = cn('mb-1 block text-gray-700');
  const fieldClassName = cn(
    'w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none',
  );

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClassName}>
            {t('form.email.label')}
          </label>
          <input
            id="email"
            type="text"
            {...register('email')}
            placeholder={t('form.email.placeholder')}
            className={fieldClassName}
          />
          {errors.email && <div>{t('form.email.error')}</div>}
        </div>
        <div>
          <label htmlFor="password" className={labelClassName}>
            {t('form.password.label')}
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder={t('form.password.placeholder')}
            className={fieldClassName}
          />
          {errors.password && <div>{t('form.password.error')}</div>}
          {errors.root && <div>{errors.root.message}</div>}
        </div>

        <button
          type="submit"
          disabled={buttonDisabled}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          {isSubmitting || isSubmitSuccessful ? 'Logging in...' : t('form.buttons.submit')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {t('form.buttons.no-account')}{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          {t('form.buttons.register')}
        </Link>
      </p>
    </div>
  );
}
