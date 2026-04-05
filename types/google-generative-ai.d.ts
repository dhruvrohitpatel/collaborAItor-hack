declare module "@google/generative-ai" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: {
      model: string;
      generationConfig?: { responseMimeType?: string };
    }): {
      generateContent(prompt: string): Promise<{
        response: {
          text(): string;
        };
      }>;
    };
  }
}
