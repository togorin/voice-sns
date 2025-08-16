'use client';

import { useEffect } from 'react';

export default function ViewportHeightManager() {
  useEffect(() => {
    const setVhVariable = () => {
      // 実際のビューポートの高さの1%を計算し、CSSカスタムプロパティとして設定
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 最初に一度実行
    setVhVariable();

    // 画面サイズが変わるたびに再計算
    window.addEventListener('resize', setVhVariable);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', setVhVariable);
    };
  }, []);

  return null; // このコンポーネントはUIを持たない
}
