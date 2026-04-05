"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import type { StudentIntake } from "@/types/domain";

interface AvailabilityPickerProps {
  value: StudentIntake["availability"];
  onChange: (availability: StudentIntake["availability"]) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

const TIMES: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

export function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  const [activeDay, setActiveDay] = useState<Day | null>(null);
  const [pendingStart, setPendingStart] = useState("09:00");
  const [pendingEnd, setPendingEnd] = useState("17:00");

  function slotsForDay(day: Day) {
    return value.filter((s) => s.day === day);
  }

  function handleDayClick(day: Day) {
    if (activeDay === day) {
      setActiveDay(null);
      return;
    }
    setPendingStart("09:00");
    setPendingEnd("17:00");
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
    // Reset to next non-overlapping default
    setPendingStart("09:00");
    setPendingEnd("17:00");
  }

  function handleRemoveSlot(day: Day, start: string, end: string) {
    onChange(value.filter((s) => !(s.day === day && s.start === start && s.end === end)));
  }

  const endOptions = TIMES.filter((t) => t > pendingStart);
  const activeDaySlots = activeDay ? slotsForDay(activeDay) : [];

  return (
    <div className="space-y-3">
      {/* Day buttons */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const slots = slotsForDay(day);
          const hasSlots = slots.length > 0;
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={[
                "relative px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                isActive
                  ? "bg-blue-500 text-white border-blue-500"
                  : hasSlots
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
              ].join(" ")}
            >
              {day}
              {slots.length > 1 && (
                <span className={[
                  "absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive ? "bg-white text-blue-500" : "bg-blue-500 text-white"
                ].join(" ")}>
                  {slots.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Time range adder */}
      {activeDay && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">{activeDay}</p>

          {/* Existing slots for this day */}
          {activeDaySlots.length > 0 && (
            <div className="space-y-1.5">
              {activeDaySlots.map((slot) => (
                <div
                  key={`${slot.start}-${slot.end}`}
                  className="flex items-center justify-between rounded-md bg-white border border-blue-200 px-3 py-1.5"
                >
                  <span className="text-sm text-blue-700 font-medium">
                    {slot.start} – {slot.end}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(activeDay, slot.start, slot.end)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove slot"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new slot */}
          <div className="space-y-2">
            <p className="text-xs text-blue-600 font-medium">Add a time slot</p>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">From</label>
                <select
                  value={pendingStart}
                  onChange={(e) => {
                    setPendingStart(e.target.value);
                    if (pendingEnd <= e.target.value) {
                      const next = TIMES.find((t) => t > e.target.value);
                      if (next) setPendingEnd(next);
                    }
                  }}
                  className="rounded-md border border-blue-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {TIMES.slice(0, -1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <span className="mt-5 text-gray-400">–</span>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">To</label>
                <select
                  value={pendingEnd}
                  onChange={(e) => setPendingEnd(e.target.value)}
                  className="rounded-md border border-blue-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {endOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddSlot}
                className="mt-5 flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Done
          </button>
        </div>
      )}

      {/* Summary */}
      {value.length > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected availability</p>
          {DAYS.filter((d) => slotsForDay(d).length > 0).map((day) => (
            <div key={day} className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-600 w-8 pt-1">{day}</span>
              <div className="flex flex-wrap gap-1.5">
                {slotsForDay(day).map((slot) => (
                  <span
                    key={`${slot.start}-${slot.end}`}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700"
                  >
                    {slot.start}–{slot.end}
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(day, slot.start, slot.end)}
                      className="text-blue-400 hover:text-red-500 transition-colors leading-none ml-0.5"
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
      )}
    </div>
  );
}
