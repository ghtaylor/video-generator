import { z } from "zod";

export const QuoteWithSpeechChunk = z.object({
  value: z.string(),
  start: z.number(),
  end: z.number(),
});

export const QuoteWithSpeech = z.object({
  text: z.string(),
  audioLocation: z.string(),
  chunks: z.array(QuoteWithSpeechChunk),
});

export type QuoteWithSpeechChunk = z.infer<typeof QuoteWithSpeechChunk>;
export type QuoteWithSpeech = z.infer<typeof QuoteWithSpeech>;
