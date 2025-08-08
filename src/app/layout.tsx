import type { Metadata } from "next";
// Single_Dayの代わりにUnboundedをインポートします
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
// Unboundedフォントを読み込みます
const unbounded = Unbounded({ 
  subsets: ["latin"], 
  weight: ['400', '700', '900'], // 使用するフォントの太さを指定
  variable: '--font-unbounded' 
});

export const metadata: Metadata = {
  title: "stew",
  description: "A voice-based social media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // htmlタグのclassNameに、新しいフォント変数を適用します
    <html lang="en" className={`${inter.variable} ${unbounded.variable}`}>
      <body>{children}</body>
    </html>
  );
}
