import { expandedStudents } from "@/data/generateExpandedStudents";
import { seedStudents } from "@/data/seedStudents";
import { parseEmailList } from "@/lib/email";
import type { StudentIntake } from "@/types/domain";

const DEMO_HOST_EMAIL = "dhruvpatel007k@gmail.com";

const teamOneAvailabilityOverrides: Partial<Record<string, StudentIntake["availability"]>> = {
  "stu-03": [
    { day: "Tue", start: "16:00", end: "18:00" },
    { day: "Thu", start: "18:00", end: "20:00" }
  ],
  "stu-04": [
    { day: "Tue", start: "17:00", end: "19:00" },
    { day: "Thu", start: "18:00", end: "20:00" }
  ],
  "stu-02": [
    { day: "Tue", start: "17:00", end: "19:00" },
    { day: "Thu", start: "18:00", end: "20:00" }
  ],
  "stu-08": [
    { day: "Tue", start: "16:00", end: "18:00" },
    { day: "Fri", start: "18:00", end: "20:00" }
  ],
  "stu-11": [
    { day: "Tue", start: "16:00", end: "18:00" },
    { day: "Sun", start: "14:00", end: "16:00" }
  ]
};

const teamOnePersonaOverrides: Partial<Record<string, Partial<StudentIntake>>> = {
  "stu-01": {
    name: "Dhruv Patel",
    email: "dhruvpatel007k@gmail.com",
    timezone: "America/Phoenix",
    strengths: ["full-stack", "ai-workflows", "demo-polish"],
    growthAreas: ["delegation", "testing"],
    preferredRole: "AI workflow lead",
    communicationStyle: "collaborative",
    collaborationPreferences: ["clear ownership", "async updates"],
    shortReflection:
      "I like tightening end-to-end demos, making the workflow feel polished, and keeping the team moving toward a clear ship date."
  },
  "stu-02": {
    name: "Wasil Ahmad",
    email: "wasil.ahmad4@gmail.com",
    timezone: "America/Phoenix",
    shortReflection:
      "I like moving quickly through backend and product decisions so the team can ship a clean demo under time pressure."
  },
  "stu-04": {
    name: "Dhruv Patel 3F",
    email: "dhruvpatel3f@gmail.com",
    timezone: "America/Phoenix",
    shortReflection:
      "I focus on implementation speed, API reliability, and making sure the working demo holds together under pressure."
  },
  "stu-09": {
    name: "Prisha Nag",
    email: "prisha.r.nag@gmail.com",
    timezone: "America/Phoenix",
    availability: [
      { day: "Tue", start: "16:00", end: "18:00" },
      { day: "Thu", start: "18:00", end: "20:00" }
    ],
    shortReflection:
      "I help keep the team organized, push decisions forward, and make sure the final story is clear for judges."
  }
};

function cloneAvailability(availability: StudentIntake["availability"]) {
  return availability.map((slot) => ({ ...slot }));
}

function applyDemoPersonaOverrides(students: StudentIntake[]) {
  const demoEmails = parseEmailList(process.env.DEMO_STUDENT_EMAILS);
  const hostEmail = demoEmails[0];

  if (hostEmail !== DEMO_HOST_EMAIL) {
    return students.map((student) => ({ ...student, availability: cloneAvailability(student.availability) }));
  }

  return students.map((student) => {
    const personaOverride = teamOnePersonaOverrides[student.id];
    const availabilityOverride = teamOneAvailabilityOverrides[student.id];

    if (student.id === "stu-01") {
      return {
        ...student,
        ...personaOverride,
        availability: [
          { day: "Tue", start: "16:00", end: "18:00" },
          { day: "Thu", start: "18:00", end: "20:00" }
        ],
      } satisfies StudentIntake;
    }

    return {
      ...student,
      ...personaOverride,
      availability: availabilityOverride
        ? cloneAvailability(availabilityOverride)
        : personaOverride?.availability
          ? cloneAvailability(personaOverride.availability)
          : cloneAvailability(student.availability)
    };
  });
}

function applyDemoStudentEmailOverrides(students: StudentIntake[]) {
  const overrides = parseEmailList(process.env.DEMO_STUDENT_EMAILS).slice(0, 2);

  if (!overrides.length) {
    return students.map((student) => ({
      ...student,
      availability: cloneAvailability(student.availability)
    }));
  }

  return students.map((student, index) =>
    index < overrides.length
      ? {
          ...student,
          email: overrides[index],
          availability: cloneAvailability(student.availability)
        }
      : { ...student, availability: cloneAvailability(student.availability) }
  );
}

export function getSeedStudents() {
  return applyDemoPersonaOverrides(applyDemoStudentEmailOverrides(seedStudents));
}

export function getExpandedStudents() {
  return applyDemoPersonaOverrides(applyDemoStudentEmailOverrides(expandedStudents));
}
