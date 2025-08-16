import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";
import ViewportHeightManager from "@/components/ViewportHeightManager"; // 新しいコンポーネントをインポート

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const unbounded = Unbounded({ 
  subsets: ["latin"], 
  weight: ['400', '700', '900'],
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
    <html lang="en" className={`${inter.variable} ${unbounded.variable}`}>
      <body>
        <ViewportHeightManager /> {/* この行を追加 */}
        {children}
      </body>
    </html>
  );
}
