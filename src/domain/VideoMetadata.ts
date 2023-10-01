import { z } from "zod";

export const VideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
  backgroundVideoUrl: z.string().url(),
});

export const VideoMetadata = z.object({
  sections: z.array(VideoSection),
});

export type VideoSection = z.infer<typeof VideoSection>;
export type VideoMetadata = z.infer<typeof VideoMetadata>;
