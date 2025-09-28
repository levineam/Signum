import type { Metadata } from "next";
import { Architects_Daughter, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

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
    <html lang="en">
      <body
        className={`${architectsDaughter.variable} ${firaCode.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
