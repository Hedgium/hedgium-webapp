import ProtectedRoute from "@/components/ProtectedRoute";

import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";


export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>
    <AuthNav />
    {children}
    <AuthFooter />
    </ProtectedRoute>;
}
