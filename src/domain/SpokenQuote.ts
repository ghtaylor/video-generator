import { z } from "zod";

export const SpokenQuoteChunk = z.object({
  value: z.string(),
  start: z.number(),
  end: z.number(),
});

export const SpokenQuote = z.object({
  title: z.string(),
  text: z.string(),
  audioUrl: z.string(),
  chunks: z.array(SpokenQuoteChunk),
});

export type SpokenQuoteChunk = z.infer<typeof SpokenQuoteChunk>;
export type SpokenQuote = z.infer<typeof SpokenQuote>;
