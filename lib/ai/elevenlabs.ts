const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export function getElevenLabsVoiceId() {
  return process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
}

export function getElevenLabsModelId() {
  return process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;
}

export function hasElevenLabsCredentials() {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export async function synthesizeSpeechWithElevenLabs(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ElevenLabs is not configured. Set ELEVENLABS_API_KEY.");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${getElevenLabsVoiceId()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: getElevenLabsModelId(),
        output_format: "mp3_44100_128"
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs API error: ${response.status}${errorText ? ` - ${errorText}` : ""}`
    );
  }

  return response.arrayBuffer();
}
