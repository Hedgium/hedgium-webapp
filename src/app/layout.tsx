'use client'

import './global.css'

// import { Roboto_Flex } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import NotificationProvider from '@/providers/NotificationProvider'
import { Raleway } from 'next/font/google';
import { Outfit } from 'next/font/google';
import { Sora } from 'next/font/google';
import { Plus_Jakarta_Sans } from 'next/font/google';

import AuthProvider from "@/providers/AuthProvider";
import NextTopLoader from 'nextjs-toploader';

const font = Plus_Jakarta_Sans({
  weight: ["200", "300", "400", "600", "700"],
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
      if (!isInitializing && accessToken){
        if (user?.kyc_skipped) {
          if (!pathname.includes("hedgium")) {
            router.push("/hedgium/dashboard/");
          }
          return;
        }
        else if (user?.signup_step=="initiated"){
          router.push("/register/complete-profile")
        } else if(user?.signup_step=="documents_uploaded"){
          router.push("/register/add-broker")
        } else if (user?.signup_step=="broker_profile_added"){
          router.push("/register/verification")
        } else if (user?.signup_step=="verified" && !pathname.includes("hedgium")){
          router.push("/hedgium/dashboard/")
        }
      } 
    }, [accessToken, isInitializing, router, pathname]);


  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply globally */}
      <body
      className={font.className + " min-h-screen flex flex-col"} >
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
