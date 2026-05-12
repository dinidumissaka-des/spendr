"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export default function BottomDrawer({ open, onClose, title, children, contentClassName }: Props) {

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto bg-[#080f05]/85 backdrop-blur-2xl border-t border-x border-white/10 rounded-t-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {title && (
          <div className="px-4 pt-1 pb-3 border-b border-white/10 flex items-center justify-between">
            <p className="font-sans font-semibold text-white text-base">{title}</p>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.07] border border-white/[0.1] text-white/40 hover:text-white/90 hover:border-white/[0.3] transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className={`overflow-y-auto max-h-[60vh] p-2 ${contentClassName ?? ""}`} style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
