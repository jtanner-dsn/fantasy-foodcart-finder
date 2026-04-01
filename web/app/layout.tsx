import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import NavBar from '@/components/NavBar';

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
    <html lang="en">
      <body className="min-h-screen bg-stone-900 text-stone-100">
        <RoleProvider>
          <NavBar />
          <main>{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}
