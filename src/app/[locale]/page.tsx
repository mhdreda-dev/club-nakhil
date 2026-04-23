import { getAuthSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getAuthSession();

  if (session) {
    const role = session.user?.role;
    if (role === Role.ADMIN) redirect(`/${locale}/admin/dashboard`);
    if (role === Role.COACH) redirect(`/${locale}/coach/dashboard`);
    if (role === Role.MEMBER) redirect(`/${locale}/member/dashboard`);
  }

  redirect(`/${locale}/login`);
}
