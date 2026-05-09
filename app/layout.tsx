import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const LightRays = dynamic(() => import("@/components/background/LightRays"), { ssr: false });
const GrainOverlay = dynamic(() => import("@/components/background/GrainOverlay"), { ssr: false });

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minti",
  description: "Personal expense tracker",
  openGraph: {
    title: "Minti",
    description: "Personal expense tracker",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  icons: {
    icon: "/minti-favicon.png",
    apple: "/minti-favicon.png",
  },
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
        <GrainOverlay />
        <InstallPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
