import { z } from "zod";

export const QuoteVideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
  backgroundVideoUrl: z.string().url(),
});

export const QuoteVideo = z.object({
  sections: z.array(QuoteVideoSection),
});

export type QuoteVideoSection = z.infer<typeof QuoteVideoSection>;
export type QuoteVideo = z.infer<typeof QuoteVideo>;
