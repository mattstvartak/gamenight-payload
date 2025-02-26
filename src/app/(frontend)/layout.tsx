import React from "react";
import { ThemeProvider } from 'next-themes'
import "../globals.css";

export const metadata = {
  description: "A Game Night planning app and library manager for game enthusiasts.",
  title: "GameNight App",
  icons: {
    icon: '/images/favicon.png', // /public path
  },
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
