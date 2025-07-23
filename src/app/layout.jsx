// src/app/layout.jsx
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
