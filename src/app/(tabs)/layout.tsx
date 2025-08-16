import TabBar from "@/components/TabBar";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <TabBar />
    </div>
  );
}
