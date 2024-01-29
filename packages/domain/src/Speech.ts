import { z } from "zod";

export const SpeechMark = z.object({
  value: z.string(),
  time: z.number(),
});

export type SpeechMark = z.infer<typeof SpeechMark>;

export type Speech = {
  audio: Buffer;
  marks: SpeechMark[];
};
