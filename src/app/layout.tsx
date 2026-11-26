import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FinGroww - Personal Wealth, Accounts & Expense Command Center",
  description: "Track bank accounts, daily expenses, investments, grow wealth, and control loans with precision.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinGroww",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body 
        className="min-h-full flex flex-col bg-slate-50/80 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 relative"
        suppressHydrationWarning
      >
        {/* Subtle Ambient Refraction Blobs for Glassmorphism */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none">
          <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-emerald-200/35 blur-[130px]" />
          <div className="absolute top-[25%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-sky-200/30 blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-teal-100/40 blur-[150px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
