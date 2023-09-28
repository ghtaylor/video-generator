import { z } from "zod";

export const QuoteVideoSection = z.object({
  text: z.string(),
  backgroundVideoUrl: z.string().url(),
});

export const QuoteVideo = z.object({
  sectionDurationInFrames: z.number(),
  sections: z.array(QuoteVideoSection),
});

export type QuoteVideoSection = z.infer<typeof QuoteVideoSection>;
export type QuoteVideo = z.infer<typeof QuoteVideo>;
