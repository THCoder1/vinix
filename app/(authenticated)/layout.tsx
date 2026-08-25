import AppNav from "@/components/navigation/AppNav";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="shell">
      <AppNav />
      {children}
    </div>
  );
}