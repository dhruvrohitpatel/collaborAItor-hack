import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getTeamByMemberEmail, loadDemoSeed } from "@/lib/repo";

const originalDemoStudentEmails = process.env.DEMO_STUDENT_EMAILS;
const originalUseMockData = process.env.USE_MOCK_DATA;

describe("team lookup by member email", () => {
  beforeEach(async () => {
    process.env.USE_MOCK_DATA = "true";
    process.env.DEMO_STUDENT_EMAILS = "student1@example.edu,student2@example.edu";
    await loadDemoSeed();
  });

  afterEach(() => {
    if (originalUseMockData === undefined) {
      delete process.env.USE_MOCK_DATA;
    } else {
      process.env.USE_MOCK_DATA = originalUseMockData;
    }

    if (originalDemoStudentEmails === undefined) {
      delete process.env.DEMO_STUDENT_EMAILS;
    } else {
      process.env.DEMO_STUDENT_EMAILS = originalDemoStudentEmails;
    }
  });

  it("finds the assigned team for a seeded student email", async () => {
    const team = await getTeamByMemberEmail("Student1@example.edu");

    expect(team).not.toBeNull();
    expect(team?.members.some((member) => member.email === "student1@example.edu")).toBe(true);
  });

  it("finds Team-1 for the Dhruv demo account after reseeding", async () => {
    process.env.DEMO_STUDENT_EMAILS = "dhruvpatel007k@gmail.com";
    await loadDemoSeed();

    const team = await getTeamByMemberEmail("dhruvpatel007k@gmail.com");

    expect(team?.id).toBe("Team-1");
    expect(
      team?.members.some(
        (member) => member.email === "dhruvpatel007k@gmail.com" && member.name === "Dhruv Patel"
      )
    ).toBe(true);
    expect(team?.members.map((member) => member.email)).toEqual([
      "dhruvpatel007k@gmail.com",
      "wasil.ahmad4@gmail.com",
      "prisha.r.nag@gmail.com",
      "dhruvpatel3f@gmail.com"
    ]);
  });
});
