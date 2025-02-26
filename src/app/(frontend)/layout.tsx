import React from "react";
import { ThemeProvider } from 'next-themes'
import "../globals.css";

export const metadata = {
  description: "A blank template using Payload in a Next.js app.",
  title: "Payload Blank Template",
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem={true}><main>{children}</main></ThemeProvider>
      </body>
    </html>
  );
}
