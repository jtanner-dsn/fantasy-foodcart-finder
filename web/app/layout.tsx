import type { Metadata } from 'next';
import { Cinzel, Lora } from 'next/font/google';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import NavBar from '@/components/NavBar';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700', '900'],
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-body',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Adventurer's Food-Cart Finder",
  description: 'Discover the wandering carts and stalls of Misthaven.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-stone-900 text-stone-100 font-body">
        <RoleProvider>
          <NavBar />
          <main>{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}
