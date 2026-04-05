/**
 * Thin wrapper around the Gemini API.
 *
 * Credential priority:
 *   1. GEMINI_API_KEY  — Google AI Studio key
 *   2. VERTEX_PROJECT_ID — Vertex AI via Application Default Credentials
 *
 * Always requests JSON output (`responseMimeType: "application/json"`).
 * Callers are responsible for parsing and validating the returned value.
 */

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export class GeminiApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

export function isGeminiRateLimitError(error: unknown) {
  return error instanceof GeminiApiError && error.status === 429;
}

export async function callGeminiForJSON(prompt: string): Promise<unknown> {
  if (process.env.GEMINI_API_KEY) {
    return callViaAPIKey(prompt, process.env.GEMINI_API_KEY);
  }

  if (process.env.VERTEX_PROJECT_ID) {
    return callViaVertex(prompt, process.env.VERTEX_PROJECT_ID);
  }

  throw new Error("No Gemini credentials found (GEMINI_API_KEY or VERTEX_PROJECT_ID)");
}

async function callViaAPIKey(prompt: string, apiKey: string): Promise<unknown> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new GeminiApiError(response.status, `Gemini API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    throw new Error("Gemini API returned no JSON content.");
  }

  return JSON.parse(text);
}

async function callViaVertex(prompt: string, projectId: string): Promise<unknown> {
  const location = process.env.VERTEX_LOCATION ?? "us-central1";
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${getGeminiModel()}:generateContent`;

  const tokenRes = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );

  if (!tokenRes.ok) {
    throw new GeminiApiError(tokenRes.status, `Failed to fetch Vertex ADC token: ${tokenRes.status}`);
  }

  const { access_token: accessToken } = (await tokenRes.json()) as { access_token: string };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new GeminiApiError(response.status, `Vertex API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    throw new Error("Vertex API returned no JSON content.");
  }

  return JSON.parse(text);
}
