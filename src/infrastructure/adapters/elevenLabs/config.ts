import { z } from "zod";

export const ElevenLabsConfig = z.object({
  apiKey: z.string(),
  voiceId: z.string(),
  modelId: z.string(),
});

export type ElevenLabsConfig = z.infer<typeof ElevenLabsConfig>;
