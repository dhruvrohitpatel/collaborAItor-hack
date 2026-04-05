"use client";

import { useState } from "react";
import { X, Clock } from "lucide-react";

import type { StudentIntake } from "@/types/domain";

interface AvailabilityPickerProps {
  value: StudentIntake["availability"];
  onChange: (availability: StudentIntake["availability"]) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_FULL: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
};
type Day = (typeof DAYS)[number];

const TIMES: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${ampm}`;
}

export function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  const [activeDay, setActiveDay] = useState<Day | null>(null);
  const [pendingStart, setPendingStart] = useState("09:00");
  const [pendingEnd, setPendingEnd] = useState("17:00");
  const [showAdder, setShowAdder] = useState(false);

  function slotsForDay(day: Day) {
    return value.filter((s) => s.day === day);
  }

  function handleDayClick(day: Day) {
    if (activeDay === day) { setActiveDay(null); return; }
    setPendingStart("09:00");
    setPendingEnd("17:00");
    // show adder immediately only if this day has no slots yet
    setShowAdder(value.filter((s) => s.day === day).length === 0);
    setActiveDay(day);
  }

  function handleAddSlot() {
    if (!activeDay) return;
    const updated = [
      ...value,
      { day: activeDay, start: pendingStart, end: pendingEnd }
    ].sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return dayDiff !== 0 ? dayDiff : a.start.localeCompare(b.start);
    });
    onChange(updated);
    setPendingStart("09:00");
    setPendingEnd("17:00");
    setShowAdder(false); // hide after adding
  }

  function handleRemoveSlot(day: Day, start: string, end: string) {
    const updated = value.filter(
      (s) => !(s.day === day && s.start === start && s.end === end)
    );
    onChange(updated);
    // if last slot removed for active day, show adder again
    if (activeDay === day && updated.filter((s) => s.day === day).length === 0) {
      setShowAdder(true);
    }
  }

  const endOptions = TIMES.filter((t) => t > pendingStart);
  const totalSlots = value.length;

  return (
    <div className="space-y-4">

      <p className="text-sm text-gray-500">
        Click a day to add your available hours. You can add multiple time slots per day.
      </p>

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => {
          const slots = slotsForDay(day);
          const hasSlots = slots.length > 0;
          const isActive = activeDay === day;
          const isWeekend = day === "Sat" || day === "Sun";

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={[
                "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-1 transition-all duration-150 select-none",
                isActive
                  ? "border-blue-500 bg-blue-500 text-white shadow-md scale-105"
                  : hasSlots
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : isWeekend
                  ? "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-300 hover:bg-gray-100"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50"
              ].join(" ")}
            >
              <span className="text-xs font-semibold tracking-wide uppercase">{day}</span>
              <div className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                isActive
                  ? "bg-white/20 text-white"
                  : hasSlots
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-400"
              ].join(" ")}>
                {hasSlots ? slots.length : "+"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded day panel */}
      {activeDay && (
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-500">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">{DAY_FULL[activeDay]}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveDay(null)}
              className="text-white/70 hover:text-white text-xs underline transition-colors"
            >
              Done
            </button>
          </div>

          <div className="p-4 space-y-4">

            {/* Existing slots */}
            {slotsForDay(activeDay).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Added slots</p>
                <div className="flex flex-wrap gap-2">
                  {slotsForDay(activeDay).map((slot) => (
                    <div
                      key={`${slot.start}-${slot.end}`}
                      className="flex items-center gap-2 rounded-lg bg-white border border-blue-200 px-3 py-2 shadow-sm"
                    >
                      <span className="text-sm font-medium text-blue-800">
                        {formatTime(slot.start)} – {formatTime(slot.end)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(activeDay, slot.start, slot.end)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Remove slot"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adder — show selectors or "+ Add another slot" link */}
            {showAdder ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {slotsForDay(activeDay).length > 0 ? "Add another slot" : "Add a time slot"}
                </p>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500 font-medium">From</label>
                    <select
                      value={pendingStart}
                      onChange={(e) => {
                        setPendingStart(e.target.value);
                        if (pendingEnd <= e.target.value) {
                          const next = TIMES.find((t) => t > e.target.value);
                          if (next) setPendingEnd(next);
                        }
                      }}
                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {TIMES.slice(0, -1).map((t) => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                      ))}
                    </select>
                  </div>

                  <span className="pb-2.5 text-gray-400 font-medium">to</span>

                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500 font-medium">To</label>
                    <select
                      value={pendingEnd}
                      onChange={(e) => setPendingEnd(e.target.value)}
                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {endOptions.map((t) => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdder(true)}
                className="text-sm font-medium text-blue-500 hover:text-blue-700 underline transition-colors"
              >
                + Add another slot
              </button>
            )}

          </div>
        </div>
      )}

      {/* Summary — only when no panel open */}
      {totalSlots > 0 && !activeDay && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Your availability — {totalSlots} slot{totalSlots !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {DAYS.filter((d) => slotsForDay(d).length > 0).map((day) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-8">{day}</span>
                <div className="flex flex-wrap gap-1.5">
                  {slotsForDay(day).map((slot) => (
                    <span
                      key={`${slot.start}-${slot.end}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {formatTime(slot.start)}–{formatTime(slot.end)}
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(day, slot.start, slot.end)}
                        className="text-blue-400 hover:text-red-500 transition-colors"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}