import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        // parkinsansをunboundedに変更します
        unbounded: ['var(--font-unbounded)'],
      },
      // minHeightを拡張して、dvhを上書きします
      minHeight: {
        'dvh': 'calc(var(--vh, 1vh) * 100)',
      },
    },
  },
  plugins: [],
};
export default config;
