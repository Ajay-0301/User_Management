import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "UserSphere | Full-Stack User Management System",
  description:
    "Enterprise-grade User Management System powered by Next.js, React, Node.js, and raw PostgreSQL queries with pg pooling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased text-slate-800 bg-slate-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

