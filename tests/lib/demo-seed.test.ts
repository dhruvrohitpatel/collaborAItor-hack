import { afterEach, describe, expect, it } from "vitest";

import { getExpandedStudents, getSeedStudents } from "@/lib/demo-seed";

const originalDemoStudentEmails = process.env.DEMO_STUDENT_EMAILS;

describe("demo seed overrides", () => {
  afterEach(() => {
    if (originalDemoStudentEmails === undefined) {
      delete process.env.DEMO_STUDENT_EMAILS;
      return;
    }

    process.env.DEMO_STUDENT_EMAILS = originalDemoStudentEmails;
  });

  it("replaces the first two seed emails when override values are present", () => {
    process.env.DEMO_STUDENT_EMAILS = "student1@example.edu,student2@example.edu";

    const students = getSeedStudents();

    expect(students[0]?.email).toBe("student1@example.edu");
    expect(students[1]?.email).toBe("student2@example.edu");
  });

  it("expands seed students without dropping the override emails", () => {
    process.env.DEMO_STUDENT_EMAILS = "student1@example.edu,student2@example.edu";

    const students = getExpandedStudents();

    expect(students.some((student) => student.email === "student1@example.edu")).toBe(true);
    expect(students.some((student) => student.email === "student2@example.edu")).toBe(true);
  });

  it("applies the Dhruv demo persona override for the host student", () => {
    process.env.DEMO_STUDENT_EMAILS = "dhruvpatel007k@gmail.com";

    const students = getSeedStudents();

    expect(students[0]?.name).toBe("Dhruv Patel");
    expect(students[0]?.email).toBe("dhruvpatel007k@gmail.com");
    expect(students[0]?.preferredRole).toBe("AI workflow lead");
    expect(students[0]?.availability).toEqual([
      { day: "Tue", start: "16:00", end: "18:00" },
      { day: "Thu", start: "18:00", end: "20:00" }
    ]);
    expect(students[1]?.email).toBe("wasil.ahmad4@gmail.com");
  });

  it("personalizes the Team-1 attendee emails for the live invite demo", () => {
    process.env.DEMO_STUDENT_EMAILS = "dhruvpatel007k@gmail.com";

    const students = getSeedStudents();

    expect(students.find((student) => student.id === "stu-02")?.email).toBe("wasil.ahmad4@gmail.com");
    expect(students.find((student) => student.id === "stu-04")?.email).toBe("dhruvpatel3f@gmail.com");
    expect(students.find((student) => student.id === "stu-09")?.email).toBe("prisha.r.nag@gmail.com");
  });
});
