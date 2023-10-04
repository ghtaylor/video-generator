import { z } from "zod";

export const BaseVideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
});

export const VideoSection = BaseVideoSection.extend({
  backgroundVideoLocation: z.string(),
});

export const VideoMetadata = z.object({
  fps: z.number(),
  description: z.string(), // quote text and hashtags
  sections: z.array(VideoSection),
});

export type BaseVideoSection = z.infer<typeof BaseVideoSection>;
export type VideoSection = z.infer<typeof VideoSection>;
export type VideoMetadata = z.infer<typeof VideoMetadata>;
