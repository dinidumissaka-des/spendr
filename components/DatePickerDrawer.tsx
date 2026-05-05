"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BottomDrawer from "./BottomDrawer";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  open: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DatePickerDrawer({ open, onClose, value, onChange }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const initial = value ? new Date(value + "T00:00:00") : new Date();

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function select(day: number) {
    onChange(toISO(viewYear, viewMonth, day));
    onClose();
  }

  // Build calendar grid (Monday-first)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const offset = firstDow === 0 ? 6 : firstDow - 1; // shift to Mon=0
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <BottomDrawer open={open} onClose={onClose} title="Select Date">
      <div className="px-4 pb-4 pt-2">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted hover:text-white hover:border-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-sans font-semibold text-white text-base">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted hover:text-white hover:border-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-mono text-muted py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;

            const iso = toISO(viewYear, viewMonth, day);
            const isSelected = iso === value;
            const isToday = iso === today;

            return (
              <button
                key={i}
                onClick={() => select(day)}
                className={`
                  aspect-square flex items-center justify-center rounded-full text-sm font-mono mx-auto w-9 h-9 transition-colors
                  ${isSelected
                    ? "bg-accent text-[#163300] font-bold"
                    : isToday
                    ? "border border-accent text-accent"
                    : "text-white hover:bg-surface2"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </BottomDrawer>
  );
}
