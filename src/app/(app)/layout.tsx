import { getValidSession } from '@/auth/utils';
import ClientProvider from '@/providers/client-provider';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await getValidSession();

  return <ClientProvider>{children}</ClientProvider>;
}
