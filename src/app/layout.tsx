// app/layout.tsx
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from 'next-themes'


import AuthProvider from "@/components/AuthProvider";

import NextTopLoader from 'nextjs-toploader';





const inter = Inter({
  subsets: ["latin"],       // add others if needed
  display: "swap",          // good CLS behavior
})

export const metadata = {
  title: "Hedgium",
  description: "AI-Powered Trading Strategies",
}

import AlertsContainer from "@/components/AlertsContainer";

import TempAlerts from "@/components/TempAlerts";

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply globally */}
      <body className={inter.className + " h-screen flex flex-col"} >
        <NextTopLoader 
          color="#2299DD"
          showSpinner={true}
          height={2}
        />
        <AuthProvider>
        <ThemeProvider>
            {children}
        </ThemeProvider>
        </AuthProvider>
        <TempAlerts />
        <AlertsContainer />

        </body>
    </html>
  )
}
