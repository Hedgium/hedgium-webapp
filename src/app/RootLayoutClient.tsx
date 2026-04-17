'use client';

import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import AuthProvider from '@/providers/AuthProvider';
import AlertsContainer from '@/components/AlertsContainer';
import AuthInitializingProvider from '@/components/AuthInitializing';
import { isLoginRootPath, isPublicPath } from '@/lib/publicRoutes';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'nextjs-toploader/app';
import { usePathname } from 'next/navigation';

/** Top-level app routes that use the authenticated shell (same as former /hedgium/*). */
const APP_SHELL_PATH_PREFIXES = [
  '/home',
  '/positions',
  '/reports',
  '/alerts',
  '/settings',
  '/upgrade',
  '/add-broker',
] as const;

function isAppShellPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_SHELL_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const requireAuth = !isPublicPath(pathname);
  const deferLoginFormUntilAuthReady = isLoginRootPath(pathname);

  useEffect(() => {
    if (!isInitializing && accessToken) {
      // During "initiated", allow signup form (/onboarding) and verify-email without forcing redirect
      if (
        user?.signup_step === 'initiated' &&
        (pathname === '/onboarding/verify-email' || pathname === '/onboarding')
      ) {
        return;
      }

      if (user?.kyc_skipped) {
        const inAppShell = isAppShellPath(pathname);
        const isSandbox = pathname?.startsWith('/sandbox');
        const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/myadmin');
        if (!inAppShell && !isSandbox && !isAdmin) {
          router.push('/home');
        }
        return;
      }
      if (user?.signup_step === 'initiated') {
        router.push('/onboarding/verify-email');
      } else if (user?.signup_step === 'email_verified') {
        const onTermsFlow =
          pathname === '/onboarding/terms' || pathname === '/onboarding/verify-email';
        if (!onTermsFlow) {
          router.push('/onboarding/terms');
        }
      } else if (user?.signup_step === 'terms_accepted') {
        if (pathname !== '/onboarding/complete-profile') {
          router.push('/onboarding/complete-profile');
        }
      } else if (
        user?.signup_step === 'documents_uploaded' ||
        user?.signup_step === 'broker_profile_added'
      ) {
        router.push('/onboarding/verification');
      } else if (user && isLoginRootPath(pathname)) {
        // e.g. signup_step === 'verified' — no earlier branch matched
        router.push('/home');
      }
    }
  }, [accessToken, isInitializing, router, pathname, user]);

  return (
    <>
      <NextTopLoader color="#2440ff" showSpinner height={2} />
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <AuthInitializingProvider
            requireAuth={requireAuth}
            deferLoginFormUntilAuthReady={deferLoginFormUntilAuthReady}
          >
            {children}
          </AuthInitializingProvider>
        </ThemeProvider>
        <AlertsContainer />
      </AuthProvider>
    </>
  );
}
