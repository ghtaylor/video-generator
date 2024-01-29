import { ChatCompletion } from "openai/resources/chat/completions";

export function buildChatCompletion(messageContent: string): ChatCompletion {
  return {
    id: "example-id",
    created: 1234567890,
    model: "example-model",
    object: "chat.completion",
    choices: [
      {
        message: {
          role: "assistant",
          content: messageContent,
        },
        finish_reason: "stop",
        index: 0,
        logprobs: null,
      },
    ],
  };
}
