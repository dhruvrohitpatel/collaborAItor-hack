import { expect, test, type Page } from "@playwright/test";

async function createTestSession(page: Page, user: {
  uid: string;
  email: string;
  role: "instructor" | "student";
  name: string;
}) {
  const response = await page.request.post("/api/auth/test-session", {
    data: {
      ...user,
      picture: null,
      emailVerified: true
    }
  });

  expect(response.ok()).toBeTruthy();
}

test("redirects unauthenticated users off protected instructor pages", async ({ page }) => {
  await page.goto("/instructor");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("loads the instructor dashboard for an authenticated instructor", async ({ page }) => {
  await createTestSession(page, {
    uid: "inst-1",
    email: "instructor@example.edu",
    role: "instructor",
    name: "Instructor"
  });

  await page.goto("/instructor");

  await expect(page.getByRole("heading", { name: "Instructor Dashboard" })).toBeVisible();
});

test("resolves a student into the my-team flow and blocks instructor pages", async ({ page }) => {
  await createTestSession(page, {
    uid: "stu-1",
    email: "student1@example.edu",
    role: "student",
    name: "Student One"
  });

  await page.goto("/my-team");
  await expect(page.getByRole("heading", { name: "My Team" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Team Workspace" })).toBeVisible();

  await page.goto("/instructor");
  await expect(page).toHaveURL(/\/my-team$/);
});
