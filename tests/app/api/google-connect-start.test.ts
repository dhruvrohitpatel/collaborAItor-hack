import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireStudentApi,
  requireApiTeamAccess,
  createGoogleOAuthUrl
} = vi.hoisted(() => ({
  requireStudentApi: vi.fn(),
  requireApiTeamAccess: vi.fn(),
  createGoogleOAuthUrl: vi.fn()
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStudentApi,
  requireApiTeamAccess,
  authErrorResponse: (error: unknown) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
}));

vi.mock("@/lib/google/oauth", () => ({
  createGoogleOAuthUrl
}));

import { POST } from "@/app/api/google/connect/start/route";

describe("google connect start route", () => {
  beforeEach(() => {
    requireStudentApi.mockResolvedValue({
      uid: "firebase-student",
      email: "student1@example.edu",
      role: "student",
      name: "Student One",
      picture: null,
      emailVerified: true
    });
    requireApiTeamAccess.mockResolvedValue({
      user: {
        uid: "firebase-student",
        email: "student1@example.edu",
        role: "student",
        name: "Student One",
        picture: null,
        emailVerified: true
      }
    });
    createGoogleOAuthUrl.mockReturnValue("https://accounts.google.com/o/oauth2/auth?state=test-state");
  });

  it("derives OAuth identity from the signed-in student session", async () => {
    const request = new Request("http://localhost/api/google/connect/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        teamId: "team-1",
        returnTo: "/teams/team-1",
        firebaseUid: "attacker-supplied",
        memberEmail: "other@example.edu"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(requireApiTeamAccess).toHaveBeenCalledWith("team-1");
    expect(createGoogleOAuthUrl).toHaveBeenCalledWith({
      teamId: "team-1",
      memberEmail: "student1@example.edu",
      firebaseUid: "firebase-student",
      returnTo: "/teams/team-1"
    });
    expect(payload).toEqual({
      oauthUrl: "https://accounts.google.com/o/oauth2/auth?state=test-state",
      state: "test-state"
    });
  });
});
