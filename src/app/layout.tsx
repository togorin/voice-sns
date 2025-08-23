import TabBar from "@/components/TabBar";
import Header from "@/components/Header"; // 新しいヘッダーをインポート

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header /> {/* ヘッダーをここに追加 */}
      <div className="flex-grow">
        {children}
      </div>
      {/* isVisible={true} を追加して、常に表示するようにします */}
      <TabBar isVisible={true} />
    </div>
  );
}
