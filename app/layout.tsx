import "./globals.css";

export const metadata = {
  title: "VINIX",
  description: "Vehicle Intelligence & Inventory System"
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
