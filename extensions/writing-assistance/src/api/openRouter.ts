import { getPreferenceValues } from "@raycast/api";
import fetch from "node-fetch";
import { ChatCompletionResponse, OpenRouterModel, Preferences } from "../types";

const { openRouterApiKey } = getPreferenceValues<Preferences>();

async function fetchModels(): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://raycast.com",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = (await response.json()) as { data: OpenRouterModel[] };
    return json.data;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw new Error("Failed to fetch models from OpenRouter.");
  }
}

async function fetchCompletions(prompt: string, model: string): Promise<string> {
  try {
    const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://raycast.com",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = (await response.json()) as ChatCompletionResponse;
    return json.choices[0].message.content;
  } catch (error) {
    console.error("Failed to fetch completions:", error);
    throw new Error("Failed to fetch completions from OpenRouter.");
  }
}

export { fetchModels, fetchCompletions };