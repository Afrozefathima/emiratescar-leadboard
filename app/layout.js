import './globals.css';
import { IBM_Plex_Sans } from 'next/font/google';

const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex' });

export const metadata = { title: 'Leads', robots: { index: false } };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plex.variable} font-sans bg-stone-100 text-stone-900 antialiased`}>{children}</body>
    </html>
  );
}
