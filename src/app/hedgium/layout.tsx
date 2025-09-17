import ProtectedRoute from "@/components/ProtectedRoute";

import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";

import AuthBottomTabs from "@/components/AuthBottomTabs";


export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>
      <AuthNav />

      <div className="flex-1 overflow-y-auto mb-16">
        {children}

        <AuthFooter />

      </div>
      
      <AuthBottomTabs />



    </ProtectedRoute>;
}
