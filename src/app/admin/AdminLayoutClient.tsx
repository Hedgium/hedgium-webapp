'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from '@/components/admin/Sidebar';
import AlertsContainer from '@/components/AlertsContainer';
import NotificationProvider from '@/providers/NotificationProvider';
import { ShieldX, LogOut } from 'lucide-react';
import {
  adminSectionForPath,
  canAccessAdminSection,
} from '@/constants/adminSections';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const section = adminSectionForPath(pathname);
  const sectionAllowed = canAccessAdminSection(user?.admin_sections, section);

  return (
    <NotificationProvider>
      {!user?.is_staff ? (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
          <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md w-full">
            <div className="card-body items-center text-center">
              <div className="rounded-full bg-error/10 p-4">
                <ShieldX className="size-10 text-error" aria-hidden />
              </div>
              <h1 className="card-title text-2xl">Access Denied</h1>
              <p className="text-base-content/70">
                This area is restricted to administrators. If you believe this
                is an error, contact support.
              </p>
              <div className="w-full flex justify-center pt-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-primary gap-2 min-w-[10rem]"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="flex flex-1 overflow-hidden">
            <aside
              aria-label="Admin sidebar"
              className="hidden md:flex md:flex-col md:shrink-0 bg-base-200 border-r border-base-300 rounded-box overflow-hidden"
            >
              <AdminSidebar />
            </aside>
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 bg-base-200 overflow-y-auto flex flex-col outline-none"
            >
              {sectionAllowed ? (
                <div className="flex-1">{children}</div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md w-full">
                    <div className="card-body items-center text-center">
                      <div className="rounded-full bg-warning/10 p-4">
                        <ShieldX className="size-10 text-warning" aria-hidden />
                      </div>
                      <h1 className="card-title text-2xl">Section restricted</h1>
                      <p className="text-base-content/70">
                        Your account does not have permission for this admin
                        section. Ask a superuser to add the section to your
                        Django group.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
          <AlertsContainer />
        </div>
      )}
    </NotificationProvider>
  );
}
