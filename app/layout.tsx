import "./globals.css";

export const metadata = {
  title: "Difotoin — Location Review Dashboard",
  description: "Price-agnostic placement analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
