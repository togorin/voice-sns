import TabBar from "@/components/TabBar";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // min-h-dvhとflexboxを使って、レイアウト全体を画面の高さに合わせます
    <div className="relative flex min-h-dvh flex-col">
      {/* flex-growクラスを追加して、この部分が利用可能なすべてのスペースを埋めるようにします */}
      <div className="flex-grow">
        {children}
      </div>
      <TabBar />
    </div>
  );
}
