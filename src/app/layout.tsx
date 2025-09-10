// app/layout.tsx
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from 'next-themes'



const inter = Inter({
  subsets: ["latin"],       // add others if needed
  display: "swap",          // good CLS behavior
})

export const metadata = {
  title: "Hedgium",
  description: "AI-Powered Trading Strategies",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply globally */}
      <body className={inter.className}>
        <ThemeProvider>
        {children}

        </ThemeProvider>
        
        
        </body>
    </html>
  )
}
