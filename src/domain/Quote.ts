import { z } from "zod";

export const Quote = z.object({
  title: z.string().describe("A brief title for the quote"),
  text: z.string().describe("The quote"),
  chunks: z
    .array(z.string())
    .describe(
      "The entire quote split into small, meaningful chunks, ending each segment at periods, commas, or clear sentence breaks, as though someone were reading it bit-by-bit",
    ),
});

export type Quote = z.infer<typeof Quote>;
