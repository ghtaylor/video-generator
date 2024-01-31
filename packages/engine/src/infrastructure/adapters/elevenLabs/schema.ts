import { z } from "zod";

export const ElevenLabsNormalizedAlignment = z.object({
  chars: z.array(z.string()),
  charStartTimesMs: z.array(z.number()),
});

export const ElevenLabsWSStandardResponse = z.object({
  audio: z.string(),
  isFinal: z.literal(null),
  normalizedAlignment: ElevenLabsNormalizedAlignment.nullable(),
});

export const ElevenLabsWSFinalResponse = z.object({
  audio: z.null(),
  isFinal: z.literal(true),
});

export const ElevenLabsWSResponse = z.discriminatedUnion("isFinal", [
  ElevenLabsWSStandardResponse,
  ElevenLabsWSFinalResponse,
]);

export type ElevenLabsNormalizedAlignment = z.infer<typeof ElevenLabsNormalizedAlignment>;
export type ElevenLabsWSStandardResponse = z.infer<typeof ElevenLabsWSStandardResponse>;
export type ElevenLabsWSFinalResponse = z.infer<typeof ElevenLabsWSFinalResponse>;
export type ElevenLabsWSResponse = z.infer<typeof ElevenLabsWSResponse>;
