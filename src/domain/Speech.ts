import { z } from "zod";

export const SpeechMark = z.object({
  value: z.string(),
  start: z.number(),
  end: z.number(),
});

export type SpeechMark = z.infer<typeof SpeechMark>;

export type Speech = {
  audio: Buffer;
  marks: SpeechMark[];
};
