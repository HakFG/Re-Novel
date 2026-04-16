import "./globals.css";

export const metadata = {
  title: "Re:Novel",
  description: "Cérebro Relacional para Escritores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="antialiased">{children}</body>
    </html>
  );
}