import { z } from "zod";
import { FilePath } from "./File";

export const GenerateQuoteParams = z.object({
  prompt: z.string().describe("The prompt to use for generating the quote"),
});

export const Quote = z.object({
  title: z.string().describe("A brief title for the quote"),
  text: z.string().describe("The quote"),
  chunks: z
    .array(z.string())
    .describe(
      "The entire quote split into small, meaningful chunks, ending each segment at periods, commas, or clear sentence breaks, as though someone were reading it bit-by-bit",
    ),
});

export const SpokenQuoteChunk = z.object({
  value: z.string(),
  start: z.number(),
  end: z.number(),
});

export const SpokenQuote = Quote.extend({ speechAudioPath: FilePath, chunks: z.array(SpokenQuoteChunk) });

export type GenerateQuoteParams = z.infer<typeof GenerateQuoteParams>;
export type Quote = z.infer<typeof Quote>;
export type SpokenQuoteChunk = z.infer<typeof SpokenQuoteChunk>;
export type SpokenQuote = z.infer<typeof SpokenQuote>;
