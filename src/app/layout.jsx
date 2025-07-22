import { Button } from "@/components/ui/button"; // Si tu utilises des composants UI

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}