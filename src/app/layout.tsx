import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";
import ViewportHeightManager from "@/components/ViewportHeightManager";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const unbounded = Unbounded({ 
  subsets: ["latin"], 
  weight: ['400', '700', '900'],
  variable: '--font-unbounded' 
});

// metadataオブジェクトを更新します
export const metadata: Metadata = {
  title: "stew",
  description: "Speak your mind.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  // OGP設定を追加します
  openGraph: {
    title: 'stew',
    description: 'Speak your mind.',
    url: 'https://stew-livid.vercel.app', // あなたのアプリの公開URLに置き換えてください
    siteName: 'stew',
    images: [
      {
        url: '/opengraph-image.png', // publicフォルダからの相対パス
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'stew',
    description: 'Speak your mind.',
    images: ['/opengraph-image.png'], // publicフォルダからの相対パス
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${unbounded.variable}`}>
      <body>
        <ViewportHeightManager />
        {children}
      </body>
    </html>
  );
}
