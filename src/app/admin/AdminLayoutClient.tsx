'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from '@/components/admin/Sidebar';
import NotificationProvider from '@/providers/NotificationProvider';
import { ShieldX, LogOut } from 'lucide-react';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

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
          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden md:flex md:flex-col md:shrink-0 bg-base-200 border-r border-base-300 rounded-box overflow-hidden">
              <AdminSidebar />
            </aside>
            <main className="flex-1 bg-base-200 overflow-y-auto flex flex-col">
              <div className="flex-1">{children}</div>
            </main>
          </div>
        </div>
      )}
    </NotificationProvider>
  );
}
