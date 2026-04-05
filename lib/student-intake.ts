import type { StudentIntake } from "@/types/domain";

export function parseCommaSeparatedList(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function stringifyCommaSeparatedList(values: string[]) {
  return values.join(", ");
}

export function parseAvailabilityText(input: string): StudentIntake["availability"] {
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [day, time] = entry.split(" ");
      const [start, end] = (time || "").split("-");

      return {
        day: (day || "Mon") as StudentIntake["availability"][number]["day"],
        start: start || "16:00",
        end: end || "18:00"
      };
    });
}

export function stringifyAvailability(availability: StudentIntake["availability"]) {
  return availability.map((slot) => `${slot.day} ${slot.start}-${slot.end}`).join(", ");
}
