'use client'

import './global.css'
import { Inter } from "next/font/google"
import { ThemeProvider } from 'next-themes'
import NotificationProvider from '@/providers/NotificationProvider'


import AuthProvider from "@/providers/AuthProvider";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({
  subsets: ["latin"],       // add others if needed
  display: "swap",          // good CLS behavior
})


import AlertsContainer from "@/components/AlertsContainer";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from 'nextjs-toploader/app';
import { usePathname } from 'next/navigation'


export default function RootLayout({ children }: { children: React.ReactNode }) {

    const { accessToken, isInitializing, user } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()
  
useEffect(() => {
  if (!isInitializing && accessToken) {

    const redirectIfNeeded = (targetPath) => {
      if (!pathname.startsWith(targetPath)) {
        router.push(targetPath);
      }
    };
    
    if (user?.kyc_skipped) {
      redirectIfNeeded("/hedgium/dashboard/");
    } 
    else if (user?.signup_step === "initiated") {
      redirectIfNeeded("/register/complete-profile");
    } 
    else if (user?.signup_step === "documents_uploaded") {
      redirectIfNeeded("/register/add-broker");
    } 
    else if (user?.signup_step === "broker_profile_added") {
      redirectIfNeeded("/register/verification");
    } 
    else if (user?.signup_step === "verified") {
      redirectIfNeeded("/hedgium/dashboard/");
    }
  }
}, [accessToken, isInitializing, router, pathname, user]);

  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply globally */}
      <body
      className={inter.className + " min-h-screen flex flex-col"} >
        <div
          style={{ display: (!isInitializing) ? 'block' : 'none' }}
        >
        <NextTopLoader 
          color="#2299DD"
          showSpinner={true}
          height={2}
        />

        <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
              {children}
          </ThemeProvider>
        </NotificationProvider>
        </AuthProvider>
        <AlertsContainer />

        </div>

        {(isInitializing) && (
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-dots loading-md"></span>
        </div>
        )}


        </body>
    </html>
  )
}
