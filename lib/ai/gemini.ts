/**
 * Thin wrapper around the Gemini SDK.
 *
 * Credential priority:
 *   1. GEMINI_API_KEY  — Google AI Studio key (simplest for dev/demo)
 *   2. VERTEX_PROJECT_ID — Vertex AI via Application Default Credentials
 *
 * Always requests JSON output (`responseMimeType: "application/json"`).
 * Callers are responsible for parsing and validating the returned value.
 *
 * Throws on missing credentials or model errors so the route can catch and
 * fall back to the mock without exposing raw error details to the client.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-1.5-flash";

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
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" }
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text);
}

async function callViaVertex(prompt: string, projectId: string): Promise<unknown> {
  // Vertex AI uses Application Default Credentials (ADC).
  // Run `gcloud auth application-default login` locally or use a service account
  // in CI/prod. The @google/generative-ai SDK does not support Vertex natively,
  // so we call the Vertex REST endpoint directly.
  const location = process.env.VERTEX_LOCATION ?? "us-central1";
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${GEMINI_MODEL}:generateContent`;

  // Fetch an ADC token via the metadata server (works on GCP) or local gcloud.
  const tokenRes = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!tokenRes.ok) {
    throw new Error(`Failed to fetch Vertex ADC token: ${tokenRes.status}`);
  }
  const { access_token: accessToken } = (await tokenRes.json()) as { access_token: string };

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Vertex API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text);
}
