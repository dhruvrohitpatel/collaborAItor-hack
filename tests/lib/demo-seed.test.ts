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
});
