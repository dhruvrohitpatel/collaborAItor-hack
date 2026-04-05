import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireStudentApi, disconnectGoogleByEmail } = vi.hoisted(() => ({
  requireStudentApi: vi.fn(),
  disconnectGoogleByEmail: vi.fn()
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStudentApi,
  authErrorResponse: (error: unknown) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
}));

vi.mock("@/lib/google/connections", () => ({
  disconnectGoogleByEmail
}));

import { POST } from "@/app/api/google/connect/revoke/route";

describe("google connect revoke route", () => {
  beforeEach(() => {
    requireStudentApi.mockResolvedValue({
      uid: "firebase-student",
      email: "student1@example.edu",
      role: "student",
      name: "Student One",
      picture: null,
      emailVerified: true
    });
    disconnectGoogleByEmail.mockResolvedValue(true);
  });

  it("revokes only the signed-in student's linked account", async () => {
    const request = new Request("http://localhost/api/google/connect/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberEmail: "other@example.edu" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(disconnectGoogleByEmail).toHaveBeenCalledWith("student1@example.edu");
    expect(payload).toEqual({
      ok: true,
      memberEmail: "student1@example.edu"
    });
  });
});
