'use client';

import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import AuthProvider from '@/providers/AuthProvider';
import AlertsContainer from '@/components/AlertsContainer';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'nextjs-toploader/app';
import { usePathname } from 'next/navigation';
import { goToPostOnboarding } from '@/utils/nativeAppReturn';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && accessToken) {
      if (pathname === '/onboarding/verify-email') return;

      if (user?.kyc_skipped) {
        const isHedgium = pathname?.includes('hedgium');
        const isSandbox = pathname?.startsWith('/sandbox');
        const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/myadmin');
        if (!isHedgium && !isSandbox && !isAdmin) {
          goToPostOnboarding(router);
        }
        return;
      }
      if (user?.signup_step === 'initiated') {
        router.push('/onboarding/verify-email');
      } else if (user?.signup_step === 'email_verified') {
        router.push('/onboarding/complete-profile');
      } else if (
        user?.signup_step === 'documents_uploaded' ||
        user?.signup_step === 'broker_profile_added'
      ) {
        router.push('/onboarding/verification');
      }
    }
  }, [accessToken, isInitializing, router, pathname, user]);

  return (
    <>
      <NextTopLoader color="#2440ff" showSpinner height={2} />
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          {children}
        </ThemeProvider>
        <AlertsContainer />
      </AuthProvider>
    </>
  );
}
