import TabBar from "@/components/TabBar";
import Header from "@/components/Header";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header />
      <div className="flex-grow">
        {children}
      </div>
      <TabBar />
    </div>
  );
}
