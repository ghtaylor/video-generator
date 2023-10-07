import { ChatCompletion } from "openai/resources/chat";

export function buildChatCompletion(messageContent: string): ChatCompletion {
  return {
    id: "example-id",
    created: 1234567890,
    model: "example-model",
    object: "text_completion",
    choices: [
      {
        message: {
          role: "assistant",
          content: messageContent,
        },
        finish_reason: "stop",
        index: 0,
      },
    ],
  };
}
