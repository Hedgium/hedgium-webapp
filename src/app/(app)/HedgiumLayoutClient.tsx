'use client';

import AuthNav from '@/components/AuthNav';
import AuthFooter from '@/components/AuthFooter';
import AuthNavigation from '@/components/AuthNavigation';
import NotificationProvider from '@/providers/NotificationProvider';
import BrokerConnect from '@/components/BrokerConnect';

export default function HedgiumLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex flex-col h-screen">
        <div className="flex flex-1 overflow-hidden">
          <aside
            aria-label="Primary navigation"
            className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-base-200 border-r border-base-300 rounded-box"
          >
            <AuthNavigation sidebar />
          </aside>
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 bg-base-200 overflow-y-auto flex flex-col outline-none"
          >
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
    </NotificationProvider>
  );
}
