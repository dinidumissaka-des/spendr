import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import LightRays from "@/components/LightRays";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

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
        <div className="fixed inset-0 z-0 bg-[#060e03]">
          <LightRays
            raysOrigin="top-center"
            raysColor="#9FE870"
            raysSpeed={1.2}
            lightSpread={0.9}
            rayLength={1.4}
            followMouse={true}
            mouseInfluence={0.12}
            noiseAmount={0.08}
            distortion={0.03}
            fadeDistance={1.2}
            saturation={0.9}
          />
        </div>
        {children}
        <InstallPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
