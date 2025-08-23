'use client';

import TabBar from "@/components/TabBar";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="flex-grow">
        {children}
      </div>
      {/* isVisibleプロパティをtrueに固定して、常にタブバーを表示します */}
      <TabBar isVisible={true} />
    </div>
  );
}