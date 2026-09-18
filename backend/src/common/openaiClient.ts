import OpenAI from "openai";
import { env } from "../config/env";

export const openai = new OpenAI({ apiKey: env.openaiApiKey });

/**
 * Calls the chat model and forces a JSON object response.
 * Used wherever we need structured extraction (enquiry parsing, menu recommendation, customization diffing).
 */
export async function askForJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}
