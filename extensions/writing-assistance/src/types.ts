export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export interface Preferences {
  openRouterApiKey: string;
}