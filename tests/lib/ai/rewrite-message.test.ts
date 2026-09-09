import { describe, expect, it } from "vitest";

import { rewriteMessage } from "@/lib/ai/mock";

describe("rewriteMessage", () => {
  it("sanitizes abusive language for professional rewrites", async () => {
    const result = await rewriteMessage(
      "Hello brian, Yo little bitch fix your shit",
      "professional",
      "brian"
    );

    expect(result.rewrittenMessage).toContain("Hello Brian,");
    expect(result.rewrittenMessage).not.toMatch(/bitch|shit|yo little/i);
    expect(result.rewrittenMessage).toMatch(/Please .*address/i);
    expect(result.rewrittenMessage).toContain("Please acknowledge by end of day.");
    expect(result.notes).toMatch(/Removed hostile language/i);
  });

  it("keeps respectful drafts readable without over-sanitizing them", async () => {
    const result = await rewriteMessage(
      "can someone review the API changes today",
      "polite",
      "teammates"
    );

    expect(result.rewrittenMessage).toContain("Hi Teammates,");
    expect(result.rewrittenMessage).toContain("Please");
    expect(result.rewrittenMessage).toContain("Let me know if you have any questions.");
  });
});
