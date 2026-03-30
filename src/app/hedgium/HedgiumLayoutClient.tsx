'use client';

import { Suspense } from 'react';
import AuthNav from '@/components/AuthNav';
import AuthFooter from '@/components/AuthFooter';
import AuthNavigation from '@/components/AuthNavigation';
import NotificationProvider from '@/providers/NotificationProvider';
import AuthInitializingProvider from '@/components/AuthInitializing';
import BrokerConnect from '@/components/BrokerConnect';
import NativeAppReturnCapture from '@/components/NativeAppReturnCapture';
import HedgiumNativeOpenBar from '@/components/HedgiumNativeOpenBar';

export default function HedgiumLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <AuthInitializingProvider requireAuth={true}>
        <Suspense fallback={null}>
          <NativeAppReturnCapture />
        </Suspense>
        <div className="flex flex-col h-screen">
          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-base-200 border-r border-base-300 rounded-box">
              <AuthNavigation sidebar />
            </aside>
            <main className="flex-1 bg-base-200 overflow-y-auto flex flex-col">
              <HedgiumNativeOpenBar />
              <BrokerConnect />
              <AuthNav />
              <div className="flex-1">{children}</div>
              <AuthFooter />
            </main>
          </div>
          <div className="md:hidden">
            <AuthNavigation />
          </div>
        </div>
      </AuthInitializingProvider>
    </NotificationProvider>
  );
}
