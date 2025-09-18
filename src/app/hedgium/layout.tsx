import ProtectedRoute from "@/components/ProtectedRoute";
import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";
import AuthNavigation from "@/components/AuthNavigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen">
        {/* Top Navbar */}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - visible on md+ */}
          <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-base-200 border-r border-base-300">
            <AuthNavigation sidebar />
          </aside>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto">
            <AuthNav />

            {children}
            <AuthFooter />
          </main>
        </div>

        {/* Bottom Navigation - visible on mobile only */}
        <div className="md:hidden">
          <AuthNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
