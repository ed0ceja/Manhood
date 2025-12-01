import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { SafeMiniKitProvider } from "@/components/safe-minikit-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Manhood - Connect Generations",
  description: "Mentorship matching app connecting wisdom sharers with wisdom seekers",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <SafeMiniKitProvider>
            {children}
          </SafeMiniKitProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
