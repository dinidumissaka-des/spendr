"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
  mask: (value: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  privacyMode: false,
  togglePrivacy: () => {},
  mask: (v) => v,
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("minti_privacy") === "true") setPrivacyMode(true);
  }, []);

  const togglePrivacy = useCallback(() => {
    setPrivacyMode((prev) => {
      localStorage.setItem("minti_privacy", String(!prev));
      return !prev;
    });
  }, []);

  const mask = useCallback(
    (value: string) => (privacyMode ? "****" : value),
    [privacyMode],
  );

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, mask }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
