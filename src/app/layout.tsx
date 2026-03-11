'use client'

import './global.css'

// import { Roboto_Flex } from 'next/font/google'
import { ThemeProvider } from 'next-themes';
import { Plus_Jakarta_Sans } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import AuthProvider from "@/providers/AuthProvider";

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
        // Don't redirect while the user is actively going through email verification
        if (pathname === "/onboarding/verify-email") return;

        if (user?.kyc_skipped) {
          if (!pathname.includes("hedgium")) {
            router.push("/hedgium/dashboard/");
          }
          return;
        }
        if (user?.signup_step === "initiated") {
          router.push("/onboarding/verify-email");
        } else if (user?.signup_step === "email_verified") {
          router.push("/onboarding/complete-profile");
        }
        else if(user?.signup_step=="documents_uploaded" || user?.signup_step=="broker_profile_added"){
          router.push("/onboarding/verification")
        } 
        // else if (user?.signup_step=="verified" && !pathname.includes("hedgium")){
        //   router.push("/hedgium/dashboard/")
        // }
      } 
    }, [accessToken, isInitializing, router, pathname, user]);


  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply globally */}
      <body
      className={font.className + " min-h-screen flex flex-col"} >
        <NextTopLoader 
          color="#244061"
          showSpinner={true}
          height={2}
        />

        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            {children}
          </ThemeProvider>
          <AlertsContainer />
        </AuthProvider>
        </body>
    </html>
  )
}
