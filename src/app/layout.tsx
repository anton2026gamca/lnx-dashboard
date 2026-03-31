import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { RobotProvider } from "@/context/RobotContext";
import "./globals.css";
import { ThemeProvider } from "next-themes";


const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LNX Dashboard",
  description: "Robot control and monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetBrainsMono.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-main-100 text-main-900 dark:bg-black dark:text-main-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RobotProvider>
            {children}
          </RobotProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
