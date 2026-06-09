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

const registerFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine(
    ({ password, confirmPassword }) => {
      if (confirmPassword !== password) {
        return false;
      }

      return true;
    },
    { message: "Passwords don't match", path: ['confirmPassword'] },
  );

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const t = useTranslations('auth.register');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    const { name, email: _email, password } = data;
    const email = _email.trim().toLowerCase();

    const { error } = await authClient.signUp.email({
      name,
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

  const nameValue = watch('name');
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const buttonDisabled =
    isSubmitting ||
    isSubmitSuccessful ||
    !nameValue ||
    !emailValue ||
    !passwordValue ||
    !confirmPasswordValue;

  const labelClassName = cn('mb-1 block text-gray-700');
  const fieldClassName = cn(
    'w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none',
  );

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className={labelClassName}>
            {t('form.name.label')}
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            placeholder={t('form.name.placeholder')}
            className={fieldClassName}
          />
          {errors.name && <div>{t('form.name.error')}</div>}
        </div>
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
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClassName}>
            {t('form.confirmPassword.label')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            placeholder={t('form.confirmPassword.placeholder')}
            className={fieldClassName}
          />
          {errors.confirmPassword && <div>{t('form.confirmPassword.error')}</div>}
          {errors.root && <div>{errors.root.message}</div>}
        </div>
        <button
          type="submit"
          disabled={buttonDisabled}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          {isSubmitting || isSubmitSuccessful
            ? t('form.buttons.loading')
            : t('form.buttons.submit')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {t('form.buttons.have-account')}{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          {t('form.buttons.login')}
        </Link>
      </p>
    </div>
  );
}
