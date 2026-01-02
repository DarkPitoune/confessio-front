"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css";
import clsx from "clsx";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const queryClient = new QueryClient();

export default function RootLayout({
  map,
  modal,
}: Readonly<{
  children: React.ReactNode;
  map: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={clsx(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <QueryClientProvider client={queryClient}>
          {modal}
          {map}
        </QueryClientProvider>
      </body>
    </html>
  );
}
