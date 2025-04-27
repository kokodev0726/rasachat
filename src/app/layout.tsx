import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATA",
  description: "Athanasios Tziovas's AI Assistant",
  icons: ["/favicon.ico", "/favicon.png"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`relative`}>
        {children}
      </body>
    </html>
  );
}
