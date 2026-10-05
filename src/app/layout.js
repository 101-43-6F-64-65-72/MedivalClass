import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata = {
  title: "Multiplayer Virtual Classroom",
  description: "Ruang Kelas Digital Interaktif dengan Presentasi Canva & Realtime Multiplayer",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`h-full ${pixelify.variable} ${pressStart.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-pixel bg-[#140802] text-[#fef3c7]">{children}</body>
    </html>
  );
}
