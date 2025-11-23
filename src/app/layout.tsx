import type { Metadata } from "next";
import { Architects_Daughter, Fira_Code } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocalNotesProvider } from "@/contexts/LocalNotesContext";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";
import { Toaster } from "sonner";

const architectsDaughter = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sans",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Signum - Journaling-First Social Platform",
  description: "A journaling-first social platform for meaning-making and authentic connection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${architectsDaughter.variable} ${firaCode.variable} antialiased`}
      >
        <ThemeProvider>
          <ReactQueryProvider>
            <AuthProvider>
              <LocalNotesProvider>
                {children}
              </LocalNotesProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
