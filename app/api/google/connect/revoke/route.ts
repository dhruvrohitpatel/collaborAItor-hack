import { NextResponse } from "next/server";
import { z } from "zod";

import { disconnectGoogleByEmail } from "@/lib/google/connections";

const requestSchema = z.object({
  memberEmail: z.string().email()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.parse(body);

  const revoked = await disconnectGoogleByEmail(parsed.memberEmail);
  if (!revoked) {
    return NextResponse.json({ error: "No Google connection found for this email." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    memberEmail: parsed.memberEmail.toLowerCase()
  });
}
