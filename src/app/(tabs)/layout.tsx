import TabBar from "@/components/TabBar";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // このdivに min-h-dvh を追加して、常に画面の高さいっぱいに広がるようにします
    <div className="min-h-dvh">
      {children}
      <TabBar />
    </div>
  );
}
