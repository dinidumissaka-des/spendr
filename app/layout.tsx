import type { Metadata, Viewport } from "next";
import { Manrope, Fraunces } from "next/font/google";
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

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#060e03",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Minti | Personal expense tracker",
  description: "Track your daily expenses and subscriptions, set budgets, and stay on top of your spending — all in one place.",
  openGraph: {
    title: "Minti | Personal expense tracker",
    description: "Track your daily expenses and subscriptions, set budgets, and stay on top of your spending — all in one place.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  other: {
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        <div className="fixed z-0 bg-[#060e03]" style={{ inset: 0, top: 'calc(-1 * env(safe-area-inset-top))' }}>
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
