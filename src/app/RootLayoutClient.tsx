'use client';

import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import AuthProvider from '@/providers/AuthProvider';
import AlertsContainer from '@/components/AlertsContainer';
import AuthInitializingProvider from '@/components/AuthInitializing';
import { isLoginRootPath, isPublicPath } from '@/lib/publicRoutes';
import { isOnboardingIncomplete, ONBOARDING_PATH } from '@/lib/onboardingSteps';
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
      if (user?.is_demo) {
        if (isLoginRootPath(pathname) || pathname?.startsWith('/onboarding')) {
          router.push('/home');
        }
        return;
      }

      if (user?.kyc_skipped) {
        const legalPending = user.onboarding?.pending?.some((p) =>
          ["email_verified", "terms", "fees", "mandate"].includes(p)
        );
        if (!legalPending) {
          const inAppShell = isAppShellPath(pathname);
          const isSandbox = pathname?.startsWith('/sandbox');
          const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/myadmin');
          if (!inAppShell && !isSandbox && !isAdmin) {
            router.push('/home');
          }
          return;
        }
      }

      if (isOnboardingIncomplete(user)) {
        if (pathname !== ONBOARDING_PATH) {
          router.push(ONBOARDING_PATH);
        }
        return;
      }

      if (user && isLoginRootPath(pathname)) {
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
