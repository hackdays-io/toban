import '@rainbow-me/rainbowkit/styles.css';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import "react-toastify/dist/ReactToastify.css";

import Toaster from '@/components/Toaster';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
