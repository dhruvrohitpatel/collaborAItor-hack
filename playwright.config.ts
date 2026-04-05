import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000"
  },
  webServer: {
    command:
      "ENABLE_TEST_AUTH=true USE_MOCK_DATA=true DEMO_STUDENT_EMAILS=student1@example.edu,student2@example.edu pnpm exec next dev -H 127.0.0.1 -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
