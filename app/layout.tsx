import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { DottedGlowBackground } from "@/components/DottedGlowBackground";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spendr",
  description: "Personal expense tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <div className="fixed inset-0 z-0">
          <DottedGlowBackground
            gap={14}
            radius={0.9}
            color="rgba(255,255,255,0.18)"
            darkColor="rgba(255,255,255,0.18)"
            glowColor="rgba(159,232,112,0.7)"
            darkGlowColor="rgba(159,232,112,0.7)"
            opacity={0.45}
            speedMin={0.15}
            speedMax={0.6}
            speedScale={1}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
