import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0A4174",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        className="min-h-full flex flex-col bg-[#f4f8fa] text-[#001D39] font-sans selection:bg-[#BDD8E9] selection:text-[#001D39] relative overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Subtle Ambient Refraction Blobs for Frosted Glass */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none">
          <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-[#BDD8E9]/30 blur-[130px]" />
          <div className="absolute top-[25%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-[#7BBDE8]/20 blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#6EA2B3]/20 blur-[150px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
