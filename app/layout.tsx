import type { Metadata } from "next";
import { Providers } from "./providers";
import "@/lib/zod-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App",
  description: "Next.js + Prisma + PostgreSQL starter template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="font-mono antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
