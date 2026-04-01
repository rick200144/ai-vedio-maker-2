import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptFlow Video',
  description: 'Real prompt-to-video app powered by the Runway API.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
