"use client";

import { PrivacyProvider } from "@/components/PrivacyContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <PrivacyProvider>{children}</PrivacyProvider>;
}
