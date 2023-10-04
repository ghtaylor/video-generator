import { z } from "zod";

export const VideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
  backgroundVideoLocation: z.string(),
});

export const VideoMetadata = z.object({
  fps: z.number(),
  description: z.string(), // quote text and hashtags
  sections: z.array(VideoSection),
});

export type VideoSection = z.infer<typeof VideoSection>;
export type VideoMetadata = z.infer<typeof VideoMetadata>;
